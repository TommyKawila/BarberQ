-- P4: track LINE push sends per shop for quota guard.
create table if not exists line_message_log (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  kind text not null
    check (kind in (
      'reply_confirm',
      'reply_ticket',
      'push_cancel',
      'push_reschedule',
      'push_test',
      'push_other'
    )),
  counted boolean not null default false,
  recipient_line_id text,
  appointment_id uuid,
  success boolean not null default true,
  error_code text,
  sent_at timestamptz not null default now()
);

create index if not exists line_message_log_shop_month_idx
  on line_message_log (shop_id, sent_at desc)
  where counted = true;

create index if not exists line_message_log_shop_counted_idx
  on line_message_log (shop_id, counted, sent_at)
  where counted = true;

create table if not exists line_webhook_events (
  webhook_event_id text primary key,
  shop_id uuid not null references shops (id) on delete cascade,
  received_at timestamptz not null default now()
);

create index if not exists line_webhook_events_shop_idx
  on line_webhook_events (shop_id, received_at desc);

alter table line_message_log enable row level security;
alter table line_webhook_events enable row level security;
