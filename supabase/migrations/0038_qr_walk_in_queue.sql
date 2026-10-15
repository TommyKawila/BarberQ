-- P8: QR walk-in waiting queue + ahead-push toggle + via_qr marker on appointments.

-- 1) Waiting-queue entries (before a walk-in appointment is created)
create table if not exists qr_queue_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  customer_line_id text not null,
  customer_name text not null,
  -- null = "first available" (default); otherwise preferred barber
  preferred_barber_id uuid references barbers (id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'started', 'cancelled', 'left')),
  appointment_id uuid references appointments (id) on delete set null,
  assigned_barber_id uuid references barbers (id) on delete set null,
  ahead_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qr_queue_one_waiting_per_customer
  on qr_queue_entries (shop_id, customer_line_id)
  where status = 'waiting';

create index if not exists qr_queue_waiting_shop_created_idx
  on qr_queue_entries (shop_id, created_at)
  where status = 'waiting';

create index if not exists qr_queue_shop_status_idx
  on qr_queue_entries (shop_id, status);

alter table qr_queue_entries enable row level security;

-- 2) QR marker on walk-in appointments (still source = walk_in for P7 stats)
alter table appointments
  add column if not exists via_qr boolean not null default false;

create index if not exists appointments_via_qr_idx
  on appointments (via_qr)
  where via_qr = true;

-- 3) Shop toggle: LINE push when 2 customers ahead (default ON)
alter table shop_settings
  add column if not exists queue_ahead_push_enabled boolean not null default true;

-- 4) Push kind for queue-ahead notification
alter table line_message_log drop constraint if exists line_message_log_kind_check;
alter table line_message_log
  add constraint line_message_log_kind_check
  check (kind in (
    'reply_confirm',
    'reply_ticket',
    'push_cancel',
    'push_reschedule',
    'push_reschedule_ticket',
    'push_reminder',
    'push_confirm',
    'push_queue_ahead',
    'push_test',
    'push_other'
  ));
