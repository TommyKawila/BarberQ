-- P5: shop toggle for server-side booking confirmation LINE push.
-- Default ON so existing shops keep current behavior; owners may turn OFF to save quota.

alter table shop_settings
  add column if not exists booking_confirm_push_enabled boolean not null default true;
