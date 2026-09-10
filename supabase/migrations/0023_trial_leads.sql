create table trial_leads (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  contact_name text not null,
  contact_value text not null,
  province text,
  barber_count integer,
  status text not null default 'NEW'
    check (status in ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  locale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trial_leads_created_at_idx on trial_leads (created_at desc);
