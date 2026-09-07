alter table shops drop constraint if exists shops_status_check;
alter table shops add constraint shops_status_check
  check (status in ('pending', 'active', 'suspended', 'cancelled'));

alter table shops
  add column if not exists invite_token text unique,
  add column if not exists invite_expires_at timestamptz;

create or replace function create_shop_invite(
  p_shop_name text,
  p_subscription_months int
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_token text;
  v_expires timestamptz;
  v_subscribed_until timestamptz;
begin
  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '7 days';
  v_subscribed_until := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, status, subscribed_until, invite_token, invite_expires_at)
  values (p_shop_name, 'pending', v_subscribed_until, v_token, v_expires)
  returning id into v_shop_id;

  return json_build_object(
    'shop_id', v_shop_id,
    'invite_token', v_token,
    'invite_expires_at', v_expires,
    'subscribed_until', v_subscribed_until
  );
end;
$$;

revoke all on function create_shop_invite(text, int) from public;
grant execute on function create_shop_invite(text, int) to service_role;

create or replace function get_shop_by_invite_token(p_invite_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop shops;
begin
  select * into v_shop from shops where invite_token = p_invite_token limit 1;
  if not found then
    return json_build_object('found', false);
  end if;

  return json_build_object(
    'found', true,
    'shop_name', v_shop.name,
    'status', v_shop.status,
    'expired', v_shop.invite_expires_at is not null and v_shop.invite_expires_at < now(),
    'claimed', v_shop.status <> 'pending'
  );
end;
$$;

revoke all on function get_shop_by_invite_token(text) from public;
grant execute on function get_shop_by_invite_token(text) to service_role;

create or replace function claim_owner_invite(
  p_invite_token text,
  p_owner_line_id text,
  p_owner_name text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop shops;
  v_owner_id uuid;
begin
  select * into v_shop from shops where invite_token = p_invite_token limit 1;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_shop.status <> 'pending' then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  if v_shop.invite_expires_at is not null and v_shop.invite_expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  if exists (select 1 from barbers where line_id = p_owner_line_id) then
    raise exception 'LINE_ID_TAKEN';
  end if;

  insert into barbers (
    shop_id, name, line_id, role, slot_duration_minutes, off_days
  ) values (
    v_shop.id,
    coalesce(p_owner_name, 'Owner'),
    p_owner_line_id,
    'owner',
    30,
    '{}'
  ) returning id into v_owner_id;

  update shops
  set
    status = 'active',
    invite_token = null,
    invite_expires_at = null,
    updated_at = now()
  where id = v_shop.id;

  return json_build_object(
    'shop_id', v_shop.id,
    'owner_id', v_owner_id
  );
end;
$$;

revoke all on function claim_owner_invite(text, text, text) from public;
grant execute on function claim_owner_invite(text, text, text) to service_role;
