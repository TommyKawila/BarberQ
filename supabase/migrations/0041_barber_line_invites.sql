-- Additive: one-time barber LINE link invites + optional display name from claim.
-- Do not apply from the agent — Tommy runs this on QA (and prod when ready).

alter table barbers
  add column if not exists line_display_name text;

create table if not exists barber_line_invites (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  barber_id uuid not null references barbers (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_barber_id uuid references barbers (id) on delete set null
);

create index if not exists barber_line_invites_shop_id_idx
  on barber_line_invites (shop_id);

create index if not exists barber_line_invites_barber_id_idx
  on barber_line_invites (barber_id);

create index if not exists barber_line_invites_pending_barber_idx
  on barber_line_invites (barber_id)
  where consumed_at is null and revoked_at is null;

-- RLS on with no policies: anon/authenticated cannot SELECT/INSERT/UPDATE/DELETE.
-- All access goes through SECURITY DEFINER RPCs, executable only by service_role.
alter table barber_line_invites enable row level security;

create or replace function create_barber_line_invite(
  p_shop_id uuid,
  p_barber_id uuid,
  p_created_by_barber_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barber barbers;
  v_token text;
  v_expires timestamptz;
  v_id uuid;
begin
  select * into v_barber
  from barbers
  where id = p_barber_id and shop_id = p_shop_id
  for update;

  if not found then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  if v_barber.is_active = false then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  -- Revoke any outstanding pending invites for this barber (single open link).
  update barber_line_invites
  set revoked_at = now()
  where barber_id = p_barber_id
    and shop_id = p_shop_id
    and consumed_at is null
    and revoked_at is null;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '7 days';

  insert into barber_line_invites (
    shop_id, barber_id, token, expires_at, created_by_barber_id
  ) values (
    p_shop_id, p_barber_id, v_token, v_expires, p_created_by_barber_id
  ) returning id into v_id;

  return json_build_object(
    'id', v_id,
    'shop_id', p_shop_id,
    'barber_id', p_barber_id,
    'token', v_token,
    'expires_at', v_expires
  );
end;
$$;

create or replace function cancel_barber_line_invite(
  p_shop_id uuid,
  p_barber_id uuid,
  p_invite_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite barber_line_invites;
begin
  select * into v_invite
  from barber_line_invites
  where id = p_invite_id
    and shop_id = p_shop_id
    and barber_id = p_barber_id
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.consumed_at is not null then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  if v_invite.revoked_at is not null then
    return json_build_object('id', v_invite.id, 'revoked_at', v_invite.revoked_at);
  end if;

  update barber_line_invites
  set revoked_at = now()
  where id = v_invite.id
  returning * into v_invite;

  return json_build_object('id', v_invite.id, 'revoked_at', v_invite.revoked_at);
end;
$$;

create or replace function get_barber_line_invite_preview(p_invite_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite barber_line_invites;
  v_shop shops;
  v_barber barbers;
begin
  if p_invite_token is null or length(trim(p_invite_token)) = 0 then
    return json_build_object('found', false);
  end if;

  select * into v_invite
  from barber_line_invites
  where token = trim(p_invite_token)
  limit 1;

  if not found then
    return json_build_object('found', false);
  end if;

  select * into v_shop from shops where id = v_invite.shop_id limit 1;
  select * into v_barber from barbers where id = v_invite.barber_id limit 1;

  -- Public-facing preview via service_role only — never return shop/barber/invite IDs.
  return json_build_object(
    'found', true,
    'shop_name', coalesce(v_shop.name, ''),
    'shop_slug', coalesce(v_shop.slug, ''),
    'barber_name', coalesce(v_barber.name, ''),
    'expired', v_invite.expires_at < now() and v_invite.consumed_at is null and v_invite.revoked_at is null,
    'consumed', v_invite.consumed_at is not null,
    'revoked', v_invite.revoked_at is not null
  );
end;
$$;

create or replace function claim_barber_line_invite(
  p_invite_token text,
  p_line_id text,
  p_display_name text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite barber_line_invites;
  v_barber barbers;
  v_shop shops;
  v_other barbers;
begin
  if p_invite_token is null or length(trim(p_invite_token)) = 0 then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if p_line_id is null or length(trim(p_line_id)) = 0 then
    raise exception 'INVALID_RANGE';
  end if;

  select * into v_invite
  from barber_line_invites
  where token = trim(p_invite_token)
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'INVITE_REVOKED';
  end if;

  if v_invite.consumed_at is not null then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  select * into v_barber
  from barbers
  where id = v_invite.barber_id and shop_id = v_invite.shop_id
  for update;

  if not found or v_barber.is_active = false then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  -- Already linked to another barber in this shop (or globally via unique line_id).
  select * into v_other
  from barbers
  where line_id = trim(p_line_id)
    and id <> v_barber.id
  limit 1;

  if found then
    if v_other.shop_id = v_invite.shop_id then
      raise exception 'LINE_ID_TAKEN';
    end if;
    raise exception 'LINE_ID_TAKEN';
  end if;

  -- Also block active managers holding this LINE id.
  if exists (
    select 1 from shop_managers
    where line_id = trim(p_line_id) and revoked_at is null
  ) then
    raise exception 'IDENTITY_INCOMPATIBLE';
  end if;

  update barbers
  set
    line_id = trim(p_line_id),
    line_display_name = nullif(trim(coalesce(p_display_name, '')), '')
  where id = v_barber.id;

  update barber_line_invites
  set consumed_at = now()
  where id = v_invite.id;

  -- Revoke sibling pending invites for this barber.
  update barber_line_invites
  set revoked_at = now()
  where barber_id = v_barber.id
    and id <> v_invite.id
    and consumed_at is null
    and revoked_at is null;

  select * into v_shop from shops where id = v_invite.shop_id limit 1;

  return json_build_object(
    'shop_id', v_invite.shop_id,
    'shop_slug', coalesce(v_shop.slug, ''),
    'barber_id', v_barber.id,
    'barber_name', v_barber.name
  );
end;
$$;

-- SECURITY DEFINER defaults to EXECUTE for PUBLIC — lock down like manager invites (0025).
revoke all on function create_barber_line_invite(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function cancel_barber_line_invite(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function get_barber_line_invite_preview(text) from public, anon, authenticated;
revoke all on function claim_barber_line_invite(text, text, text) from public, anon, authenticated;

grant execute on function create_barber_line_invite(uuid, uuid, uuid) to service_role;
grant execute on function cancel_barber_line_invite(uuid, uuid, uuid) to service_role;
grant execute on function get_barber_line_invite_preview(text) to service_role;
grant execute on function claim_barber_line_invite(text, text, text) to service_role;
