create table if not exists shop_managers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  line_id text not null,
  role text not null default 'manager' check (role = 'manager'),
  display_name text not null default 'Manager',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists shop_managers_active_line_id_idx
  on shop_managers (line_id)
  where revoked_at is null;

create index if not exists shop_managers_shop_id_idx on shop_managers (shop_id);

create table if not exists shop_manager_invites (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  role text not null default 'manager' check (role = 'manager'),
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_barber_id uuid references barbers (id) on delete set null
);

create index if not exists shop_manager_invites_shop_id_idx
  on shop_manager_invites (shop_id);

alter table shop_managers enable row level security;
alter table shop_manager_invites enable row level security;

create or replace function create_manager_invite(
  p_shop_id uuid,
  p_created_by_barber_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_expires timestamptz;
  v_id uuid;
begin
  if not exists (select 1 from shops where id = p_shop_id) then
    raise exception 'NOT_FOUND';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '7 days';

  insert into shop_manager_invites (
    shop_id, token, expires_at, created_by_barber_id
  ) values (
    p_shop_id, v_token, v_expires, p_created_by_barber_id
  ) returning id into v_id;

  return json_build_object(
    'id', v_id,
    'shop_id', p_shop_id,
    'token', v_token,
    'expires_at', v_expires
  );
end;
$$;

create or replace function regenerate_manager_invite(
  p_shop_id uuid,
  p_invite_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite shop_manager_invites;
  v_token text;
  v_expires timestamptz;
  v_id uuid;
begin
  select * into v_invite
  from shop_manager_invites
  where id = p_invite_id and shop_id = p_shop_id
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.consumed_at is not null then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'INVITE_REVOKED';
  end if;

  update shop_manager_invites
  set revoked_at = now()
  where id = v_invite.id;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '7 days';

  insert into shop_manager_invites (
    shop_id, token, expires_at, created_by_barber_id
  ) values (
    p_shop_id, v_token, v_expires, v_invite.created_by_barber_id
  ) returning id into v_id;

  return json_build_object(
    'id', v_id,
    'shop_id', p_shop_id,
    'token', v_token,
    'expires_at', v_expires
  );
end;
$$;

create or replace function cancel_manager_invite(
  p_shop_id uuid,
  p_invite_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite shop_manager_invites;
begin
  select * into v_invite
  from shop_manager_invites
  where id = p_invite_id and shop_id = p_shop_id
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

  update shop_manager_invites
  set revoked_at = now()
  where id = v_invite.id
  returning * into v_invite;

  return json_build_object('id', v_invite.id, 'revoked_at', v_invite.revoked_at);
end;
$$;

create or replace function revoke_shop_manager(
  p_shop_id uuid,
  p_manager_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manager shop_managers;
begin
  select * into v_manager
  from shop_managers
  where id = p_manager_id and shop_id = p_shop_id
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_manager.revoked_at is not null then
    return json_build_object('id', v_manager.id, 'revoked_at', v_manager.revoked_at);
  end if;

  update shop_managers
  set revoked_at = now()
  where id = v_manager.id
  returning * into v_manager;

  return json_build_object('id', v_manager.id, 'revoked_at', v_manager.revoked_at);
end;
$$;

create or replace function get_manager_invite_preview(p_invite_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite shop_manager_invites;
  v_shop shops;
begin
  if p_invite_token is null or length(trim(p_invite_token)) = 0 then
    return json_build_object('found', false);
  end if;

  select * into v_invite
  from shop_manager_invites
  where token = trim(p_invite_token)
  limit 1;

  if not found then
    return json_build_object('found', false);
  end if;

  select * into v_shop from shops where id = v_invite.shop_id limit 1;

  return json_build_object(
    'found', true,
    'shop_name', coalesce(v_shop.name, ''),
    'shop_slug', coalesce(v_shop.slug, ''),
    'expired', v_invite.expires_at < now() and v_invite.consumed_at is null and v_invite.revoked_at is null,
    'consumed', v_invite.consumed_at is not null,
    'revoked', v_invite.revoked_at is not null
  );
end;
$$;

create or replace function claim_manager_invite(
  p_invite_token text,
  p_line_id text,
  p_display_name text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite shop_manager_invites;
  v_shop shops;
  v_manager_id uuid;
  v_name text;
begin
  if p_invite_token is null or length(trim(p_invite_token)) = 0
     or p_line_id is null or length(trim(p_line_id)) = 0 then
    raise exception 'INVALID_RANGE';
  end if;

  select * into v_invite
  from shop_manager_invites
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

  if exists (
    select 1 from shop_managers
    where shop_id = v_invite.shop_id
      and line_id = trim(p_line_id)
      and revoked_at is null
  ) then
    raise exception 'MANAGER_ALREADY_ACTIVE';
  end if;

  if exists (select 1 from barbers where line_id = trim(p_line_id)) then
    raise exception 'IDENTITY_INCOMPATIBLE';
  end if;

  if exists (
    select 1 from shop_managers
    where line_id = trim(p_line_id)
      and revoked_at is null
      and shop_id <> v_invite.shop_id
  ) then
    raise exception 'IDENTITY_INCOMPATIBLE';
  end if;

  v_name := coalesce(nullif(trim(p_display_name), ''), 'Manager');

  insert into shop_managers (shop_id, line_id, display_name)
  values (v_invite.shop_id, trim(p_line_id), v_name)
  returning id into v_manager_id;

  update shop_manager_invites
  set consumed_at = now()
  where id = v_invite.id;

  select * into v_shop from shops where id = v_invite.shop_id limit 1;

  return json_build_object(
    'shop_id', v_invite.shop_id,
    'shop_slug', coalesce(v_shop.slug, ''),
    'manager_id', v_manager_id
  );
end;
$$;

revoke all on function create_manager_invite(uuid, uuid) from public;
revoke all on function regenerate_manager_invite(uuid, uuid) from public;
revoke all on function cancel_manager_invite(uuid, uuid) from public;
revoke all on function revoke_shop_manager(uuid, uuid) from public;
revoke all on function get_manager_invite_preview(text) from public;
revoke all on function claim_manager_invite(text, text, text) from public;

grant execute on function create_manager_invite(uuid, uuid) to service_role;
grant execute on function regenerate_manager_invite(uuid, uuid) to service_role;
grant execute on function cancel_manager_invite(uuid, uuid) to service_role;
grant execute on function revoke_shop_manager(uuid, uuid) to service_role;
grant execute on function get_manager_invite_preview(text) to service_role;
grant execute on function claim_manager_invite(text, text, text) to service_role;
