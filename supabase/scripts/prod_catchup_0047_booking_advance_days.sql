-- Ready-to-copy catch-up for production (idempotent).
-- Adds shop_settings.booking_advance_days (default 30). Safe to re-run.
-- Do NOT run from agents — Tommy applies when ready.

alter table public.shop_settings
  add column if not exists booking_advance_days integer not null default 30;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shop_settings_booking_advance_days_check'
  ) then
    alter table public.shop_settings
      add constraint shop_settings_booking_advance_days_check
      check (booking_advance_days >= 1 and booking_advance_days <= 90);
  end if;
end $$;

comment on column public.shop_settings.booking_advance_days is
  'Customer online booking window in calendar days (1–90), including today.';

-- Optional: verify
-- select slug, ss.booking_advance_days
-- from shops s
-- join shop_settings ss on ss.shop_id = s.id
-- where s.slug = 'barberqpilottest';
