-- D5: per-shop service catalog with prices (baht).
-- Used for revenue KPIs and price snapshot on completed bookings.

create table if not exists shop_services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  price_baht integer not null check (price_baht >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_services_shop_idx
  on shop_services (shop_id, sort_order, created_at);

-- At most one default service per shop among active rows.
create unique index if not exists shop_services_one_default_idx
  on shop_services (shop_id)
  where is_default and is_active;

alter table shop_services enable row level security;
