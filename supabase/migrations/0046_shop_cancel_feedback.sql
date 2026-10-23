-- Owner 「ไม่ใช้บริการต่อ」 feedback from the post-trial tier notice.
-- Additive only — submitting does not disable the shop or delete data.

create table if not exists shop_cancel_feedback (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  reason text not null
    check (reason in (
      'price_high',
      'hard_to_use',
      'few_bookings',
      'missing_features',
      'closing_shop',
      'other'
    )),
  detail text,
  bookable_count integer,
  recommended_tier text,
  created_by_barber_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists shop_cancel_feedback_shop_id_idx
  on shop_cancel_feedback (shop_id);

create index if not exists shop_cancel_feedback_created_at_idx
  on shop_cancel_feedback (created_at desc);

comment on table shop_cancel_feedback is
  'Owner cancel-intent feedback from admin tier billing notice. Does not auto-disable the shop.';

alter table shop_cancel_feedback enable row level security;
