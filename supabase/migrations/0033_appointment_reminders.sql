-- P5: configurable customer appointment reminders (LINE push).
-- Shop toggle OFF by default; per-booking lead time + due/sent for cron idempotency.

alter table shop_settings
  add column if not exists reminders_enabled boolean not null default false;

alter table shop_settings
  add column if not exists reminder_lead_minutes integer not null default 120;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shop_settings_reminder_lead_minutes_check'
  ) then
    alter table shop_settings
      add constraint shop_settings_reminder_lead_minutes_check
      check (reminder_lead_minutes in (1440, 180, 120, 60, 30));
  end if;
end $$;

alter table appointments
  add column if not exists reminder_lead_minutes integer;

alter table appointments
  add column if not exists reminder_due_at timestamptz;

alter table appointments
  add column if not exists reminder_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_reminder_lead_minutes_check'
  ) then
    alter table appointments
      add constraint appointments_reminder_lead_minutes_check
      check (
        reminder_lead_minutes is null
        or reminder_lead_minutes in (1440, 180, 120, 60, 30)
      );
  end if;
end $$;

create index if not exists appointments_reminder_due_idx
  on appointments (reminder_due_at)
  where reminder_sent_at is null
    and reminder_due_at is not null
    and status = 'confirmed';

-- Allow push_reminder in message log kinds.
alter table line_message_log drop constraint if exists line_message_log_kind_check;
alter table line_message_log
  add constraint line_message_log_kind_check
  check (kind in (
    'reply_confirm',
    'reply_ticket',
    'push_cancel',
    'push_reschedule',
    'push_reminder',
    'push_test',
    'push_other'
  ));
