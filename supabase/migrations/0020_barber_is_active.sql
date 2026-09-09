alter table barbers
  add column if not exists is_active boolean not null default true;

create index if not exists barbers_shop_active_idx
  on barbers (shop_id, is_active)
  where is_active = true;
