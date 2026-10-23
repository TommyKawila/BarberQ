-- Billing period on payment slips: monthly (default) or yearly (−20%).
-- Additive / safe to re-run. Approving yearly extends subscribed_until by 12 months.

alter table shop_payment_slips
  add column if not exists period text not null default 'monthly';

-- Backfill any legacy nulls (if column existed without default somehow).
update shop_payment_slips
set period = 'monthly'
where period is null or period = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shop_payment_slips_period_check'
  ) then
    alter table shop_payment_slips
      add constraint shop_payment_slips_period_check
      check (period in ('monthly', 'yearly'));
  end if;
end $$;

comment on column shop_payment_slips.period is
  'Billing period chosen at upload: monthly (+1 mo on approve) or yearly (−20%, +12 mo).';
