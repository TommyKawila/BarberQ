-- How far ahead customers may book (calendar days including today).
-- Was hardcoded to 7 in app code; default 30. Cap is 1–30 (Tommy decision).
-- Re-runnable: drops/recreates check if present; clamps any values >30 first.

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
