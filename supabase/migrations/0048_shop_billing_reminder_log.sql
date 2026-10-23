-- Idempotent log of ClipperQ-OA billing reminder pushes to shop owners.
-- Additive / re-runnable. App uses service_role; RLS on with no anon policies.
-- Unique (shop_id, reminder_kind, due_at) so cron reruns never duplicate a send.

create table if not exists shop_billing_reminder_log (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  reminder_kind text not null
    check (reminder_kind in ('day25', 'due', 'overdue3')),
  due_at date not null,
  recipient_line_id text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists shop_billing_reminder_log_uniq
  on shop_billing_reminder_log (shop_id, reminder_kind, due_at);

create index if not exists shop_billing_reminder_log_shop_id_idx
  on shop_billing_reminder_log (shop_id);

create index if not exists shop_billing_reminder_log_sent_at_idx
  on shop_billing_reminder_log (sent_at desc);

comment on table shop_billing_reminder_log is
  'Owner LINE billing reminders via ClipperQ OA (day25 / due / overdue3). Unique per shop+kind+due cycle.';

alter table shop_billing_reminder_log enable row level security;
