-- Ready-to-copy catch-up for production (idempotent / re-runnable).
-- Adds shop_settings.booking_advance_days (default 30, check 1–30).
-- If an older 1–90 check exists, drops it, clamps values >30 to 30, recreates 1–30.
-- Do NOT run from agents — Tommy applies when ready.

alter table public.shop_settings
  add column if not exists booking_advance_days integer not null default 30;

-- Clamp existing rows before (re)applying the tighter check.
update public.shop_settings
set booking_advance_days = 30
where booking_advance_days > 30;

update public.shop_settings
set booking_advance_days = 1
where booking_advance_days < 1;

alter table public.shop_settings
  drop constraint if exists shop_settings_booking_advance_days_check;

alter table public.shop_settings
  add constraint shop_settings_booking_advance_days_check
  check (booking_advance_days >= 1 and booking_advance_days <= 30);

comment on column public.shop_settings.booking_advance_days is
  'Customer online booking window in calendar days (1–30), including today.';

-- Optional: verify
-- select slug, ss.booking_advance_days
-- from shops s
-- join shop_settings ss on ss.shop_id = s.id
-- where s.slug = 'barberqpilottest';
