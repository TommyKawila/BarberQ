alter table shops add column if not exists slug text;

update shops
set slug = lower(replace(name, ' ', ''))
where slug is null;

alter table shops alter column slug set not null;
create unique index if not exists shops_slug_idx on shops (slug);

alter table shop_settings
  add column if not exists shop_id uuid references shops (id) on delete cascade;

update shop_settings
set shop_id = (select id from shops where name = 'PHINX STUDIO' limit 1)
where shop_id is null;

insert into shop_settings (shop_id)
select id from shops where name = 'TEST SHOP'
on conflict do nothing;

alter table shop_settings drop constraint if exists shop_settings_pkey;
alter table shop_settings drop constraint if exists shop_settings_id_check;
alter table shop_settings drop column if exists id;
alter table shop_settings alter column shop_id set not null;
alter table shop_settings add primary key (shop_id);

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
begin
  v_token := replace(gen_random_uuid()::text, '-', '');
  v_slug := lower(replace(p_shop_name, ' ', ''));
  v_expires := now() + interval '7 days';
  v_subscribed_until := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, slug, status, subscribed_until, invite_token, invite_expires_at)
  values (p_shop_name, v_slug, 'pending', v_subscribed_until, v_token, v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id) values (v_shop_id)
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
begin
  v_slug := lower(replace(p_shop_name, ' ', ''));
  v_expires := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, slug, status, subscribed_until)
  values (p_shop_name, v_slug, 'active', v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id) values (v_shop_id)
  on conflict (shop_id) do nothing;

  insert into barbers (
    shop_id, name, line_id, role, slot_duration_minutes, off_days
  ) values (
    v_shop_id,
    coalesce(p_owner_name, 'Owner'),
    p_owner_line_id,
    'owner',
    30,
    '{}'
  ) returning id into v_owner_id;

  return json_build_object(
    'shop_id', v_shop_id,
    'owner_id', v_owner_id,
    'subscribed_until', v_expires
  );
end;
$$;
