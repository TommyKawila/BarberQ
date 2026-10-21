-- Self-serve trial, lead↔shop link, payments + private slip storage, trialing status.

-- Allow shop status 'trialing'
alter table shops drop constraint if exists shops_status_check;
alter table shops
  add constraint shops_status_check
  check (status in ('pending', 'active', 'trialing', 'suspended', 'cancelled'));

-- Lead → shop link (assisted + self-serve)
alter table trial_leads
  add column if not exists shop_id uuid references shops (id) on delete set null;

create index if not exists trial_leads_shop_id_idx on trial_leads (shop_id)
  where shop_id is not null;

-- Payments / PromptPay slips
create table if not exists shop_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  amount_baht integer not null check (amount_baht > 0),
  plan_tier text not null,
  status text not null default 'pending'
    check (status in ('pending', 'pending_review', 'verified', 'rejected', 'failed')),
  trans_ref text,
  slip_path text,
  slip_content_type text,
  verifier text,
  verifier_raw jsonb,
  receiver_promptpay text,
  transfer_at timestamptz,
  submitted_by_line_id text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shop_payments_trans_ref_uidx
  on shop_payments (trans_ref)
  where trans_ref is not null;

create index if not exists shop_payments_shop_id_idx on shop_payments (shop_id);
create index if not exists shop_payments_status_idx on shop_payments (status);

alter table shop_payments enable row level security;

-- Expiry reminder log (7d / 3d / 0d once each per subscribed_until)
create table if not exists shop_subscription_reminders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  subscribed_until timestamptz not null,
  days_before integer not null check (days_before in (0, 3, 7)),
  sent_at timestamptz not null default now(),
  unique (shop_id, subscribed_until, days_before)
);

alter table shop_subscription_reminders enable row level security;

-- Private slip storage (service role only; no public policies)
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do update set public = excluded.public;

-- Recreate create helpers with optional days + status (drop old 4-arg overloads)
drop function if exists create_shop_invite(text, int);
drop function if exists create_shop_with_owner(text, text, text, int);

create or replace function create_shop_invite(
  p_shop_name text,
  p_subscription_months int default null,
  p_subscription_days int default null
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_token text;
  v_slug text;
  v_expires timestamptz;
  v_subscribed_until timestamptz;
  v_default_hours jsonb := '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb;
begin
  if p_subscription_days is null and p_subscription_months is null then
    raise exception 'INVALID_RANGE';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_slug := lower(replace(p_shop_name, ' ', ''));
  v_expires := now() + interval '7 days';
  if p_subscription_days is not null then
    v_subscribed_until := now() + (p_subscription_days || ' days')::interval;
  else
    v_subscribed_until := now() + (p_subscription_months || ' months')::interval;
  end if;

  insert into shops (name, slug, status, subscribed_until, invite_token, invite_expires_at)
  values (p_shop_name, v_slug, 'pending', v_subscribed_until, v_token, v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id, hours) values (v_shop_id, v_default_hours)
  on conflict (shop_id) do nothing;

  return json_build_object(
    'shop_id', v_shop_id,
    'invite_token', v_token,
    'invite_expires_at', v_expires,
    'subscribed_until', v_subscribed_until
  );
end;
$$;

create or replace function create_shop_with_owner(
  p_shop_name text,
  p_owner_line_id text,
  p_owner_name text,
  p_subscription_months int default null,
  p_subscription_days int default null,
  p_status text default 'active'
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
  v_slug text;
  v_expires timestamptz;
  v_status text;
  v_default_hours jsonb := '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb;
begin
  if p_subscription_days is null and p_subscription_months is null then
    raise exception 'INVALID_RANGE';
  end if;
  if p_status is null or p_status not in ('active', 'trialing') then
    raise exception 'INVALID_RANGE';
  end if;
  v_status := p_status;

  v_slug := lower(replace(p_shop_name, ' ', ''));
  if p_subscription_days is not null then
    v_expires := now() + (p_subscription_days || ' days')::interval;
  else
    v_expires := now() + (p_subscription_months || ' months')::interval;
  end if;

  insert into shops (name, slug, status, subscribed_until)
  values (p_shop_name, v_slug, v_status, v_expires)
  returning id into v_shop_id;

  insert into shop_settings (shop_id, hours) values (v_shop_id, v_default_hours)
  on conflict (shop_id) do nothing;

  insert into barbers (
    shop_id, name, line_id, role, slot_duration_minutes, off_days, is_bookable
  ) values (
    v_shop_id,
    coalesce(p_owner_name, 'Owner'),
    p_owner_line_id,
    'owner',
    30,
    '{}',
    false
  ) returning id into v_owner_id;

  return json_build_object(
    'shop_id', v_shop_id,
    'owner_id', v_owner_id,
    'subscribed_until', v_expires,
    'status', v_status
  );
end;
$$;

revoke all on function create_shop_invite(text, int, int) from public;
grant execute on function create_shop_invite(text, int, int) to service_role;
revoke all on function create_shop_with_owner(text, text, text, int, int, text) from public;
grant execute on function create_shop_with_owner(text, text, text, int, int, text) to service_role;

-- Extend subscription by one calendar month from max(now, subscribed_until)
create or replace function extend_shop_subscription_one_month(p_shop_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until timestamptz;
  v_base timestamptz;
  v_new timestamptz;
begin
  select subscribed_until into v_until from shops where id = p_shop_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  v_base := greatest(coalesce(v_until, now()), now());
  v_new := v_base + interval '1 month';
  update shops
  set subscribed_until = v_new,
      status = case when status = 'trialing' then 'active' else status end,
      updated_at = now()
  where id = p_shop_id;
  return v_new;
end;
$$;

revoke all on function extend_shop_subscription_one_month(uuid) from public;
grant execute on function extend_shop_subscription_one_month(uuid) to service_role;
