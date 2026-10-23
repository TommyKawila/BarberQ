-- Shop subscription payment slips (PromptPay QR + manual review).
-- Additive / re-runnable. App uses service_role; RLS on with no anon policies.
-- Paid-through date reuses shops.subscribed_until (extended +1 month on approve).

create table if not exists shop_payment_slips (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  amount_thb numeric(12, 2) not null check (amount_thb > 0),
  tier text not null
    check (tier in ('tier1', 'tier2', 'tier3', 'contact')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'rejected')),
  storage_path text not null,
  content_type text,
  note text,
  uploaded_by_barber_id uuid,
  reviewed_at timestamptz,
  reviewed_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_payment_slips_shop_id_idx
  on shop_payment_slips (shop_id);

create index if not exists shop_payment_slips_status_created_idx
  on shop_payment_slips (status, created_at desc);

comment on table shop_payment_slips is
  'Owner-uploaded PromptPay payment slips. Superadmin marks paid/rejected; paid extends shops.subscribed_until by 1 month.';

alter table shop_payment_slips enable row level security;

-- Private bucket: no public read. Service role uploads/reads via signed URLs.
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do update set public = excluded.public;
