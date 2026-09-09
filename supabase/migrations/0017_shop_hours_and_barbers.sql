-- Shop hours per shop + barber bookability + shop-scoped name uniqueness

alter table shop_settings
  add column if not exists hours jsonb;

-- PHINX default hours: Sun/Sat 10:00-20:00, Mon-Fri 10:30-20:00
update shop_settings
set hours = '[
  {"closed": false, "open": "10:00", "close": "20:00"},
  {"closed": false, "open": "10:30", "close": "20:00"},
  {"closed": false, "open": "10:30", "close": "20:00"},
  {"closed": false, "open": "10:30", "close": "20:00"},
  {"closed": false, "open": "10:30", "close": "20:00"},
  {"closed": false, "open": "10:30", "close": "20:00"},
  {"closed": false, "open": "10:00", "close": "20:00"}
]'::jsonb
where hours is null;

alter table barbers
  add column if not exists is_bookable boolean not null default true;

update barbers set is_bookable = true where is_bookable is null;

alter table barbers drop constraint if exists barbers_name_key;
create unique index if not exists barbers_shop_id_name_idx on barbers (shop_id, name);

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
  v_slug text;
  v_expires timestamptz;
  v_subscribed_until timestamptz;
  v_default_hours jsonb := '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb;
begin
  v_token := replace(gen_random_uuid()::text, '-', '');
  v_slug := lower(replace(p_shop_name, ' ', ''));
  v_expires := now() + interval '7 days';
  v_subscribed_until := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, slug, status, subscribed_until, invite_token, invite_expires_at)
  values (p_shop_name, v_slug, 'pending', v_subscribed_until, v_token, v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id, hours) values (v_shop_id, v_default_hours)
  on conflict (shop_id) do nothing;

  return json_build_object(
    'shop_id', v_shop_id,
    'invite_token', v_token,
    'invite_expires_at', v_expires,
    'subscribed_until', v_subscribed_until
  );
end;
$$;

create or replace function create_shop_with_owner(
  p_shop_name text,
  p_owner_line_id text,
  p_owner_name text,
  p_subscription_months int
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_slug text;
  v_expires timestamptz;
  v_default_hours jsonb := '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb;
begin
  v_slug := lower(replace(p_shop_name, ' ', ''));
  v_expires := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, slug, status, subscribed_until)
  values (p_shop_name, v_slug, 'active', v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id, hours) values (v_shop_id, v_default_hours)
  on conflict (shop_id) do nothing;

  insert into barbers (
    shop_id, name, line_id, role, slot_duration_minutes, off_days, is_bookable
  ) values (
    v_shop_id,
    coalesce(p_owner_name, 'Owner'),
    p_owner_line_id,
    'owner',
    30,
    '{}',
    false
  ) returning id into v_owner_id;

  return json_build_object(
    'shop_id', v_shop_id,
    'owner_id', v_owner_id,
    'subscribed_until', v_expires
  );
end;
$$;

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
    shop_id, name, line_id, role, slot_duration_minutes, off_days, is_bookable
  ) values (
    v_shop.id,
    coalesce(p_owner_name, 'Owner'),
    p_owner_line_id,
    'owner',
    30,
    '{}',
    false
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
