-- P4: Web Push for staff alerts (not LINE).
alter table shop_settings
  add column if not exists barber_webpush_scope text not null default 'own'
    check (barber_webpush_scope in ('own', 'all'));

create table if not exists web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  staff_key text not null,
  staff_role text not null
    check (staff_role in ('owner', 'manager', 'barber')),
  barber_id uuid references barbers (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  notify_new_booking boolean not null default true,
  notify_cancel boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, endpoint)
);

create index if not exists web_push_subscriptions_shop_staff_idx
  on web_push_subscriptions (shop_id, staff_key);

alter table web_push_subscriptions enable row level security;
