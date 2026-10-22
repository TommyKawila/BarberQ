-- Soft seat-tier for ClipperQ billing (additive only — Tommy runs on QA).
-- Counts bookable active barbers only; owner/manager seat is free unless is_bookable.
-- Does NOT rewrite existing barber rows (preserves booking/revenue history).

alter table shops
  add column if not exists barber_tier text not null default 'tier1'
    check (barber_tier in ('tier1', 'tier2', 'tier3', 'contact'));

comment on column shops.barber_tier is
  'ClipperQ seat tier: tier1=1–2 bookable ฿399, tier2=3–5 ฿599, tier3=6–10 ฿999, contact=>10. Soft limit only — never blocks adding barbers.';
