create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  subscribed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shops_status_idx on shops (status) where status = 'active';

alter table barbers
  add column if not exists line_id text unique,
  add column if not exists role text default 'barber' check (role in ('owner', 'barber')),
  add column if not exists shop_id uuid references shops (id) on delete cascade;

create index if not exists barbers_line_id_idx on barbers (line_id) where line_id is not null;
create index if not exists barbers_shop_id_idx on barbers (shop_id);

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
  v_expires timestamptz;
begin
  v_expires := now() + (p_subscription_months || ' months')::interval;

  insert into shops (name, status, subscribed_until)
  values (p_shop_name, 'active', v_expires)
  returning id into v_shop_id;

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

revoke all on function create_shop_with_owner(text, text, text, int) from public;
grant execute on function create_shop_with_owner(text, text, text, int) to service_role;

create or replace function get_barber_by_line_id(p_line_id text)
returns barbers
language sql
security definer
set search_path = public
as $$
  select * from barbers where line_id = p_line_id limit 1;
$$;

revoke all on function get_barber_by_line_id(text) from public;
grant execute on function get_barber_by_line_id(text) to service_role;

insert into shops (id, name, status)
values ('00000000-0000-0000-0000-000000000001', 'PHINX STUDIO', 'active')
on conflict (id) do nothing;

update barbers
set shop_id = '00000000-0000-0000-0000-000000000001'
where shop_id is null;

update barbers
set role = 'owner'
where name = 'Saeb' and role is distinct from 'owner';
