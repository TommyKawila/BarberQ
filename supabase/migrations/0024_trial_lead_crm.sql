00.alter table trial_leads
  add column if not exists follow_up_at timestamptz;

create index if not exists trial_leads_follow_up_at_idx
  on trial_leads (follow_up_at)
  where follow_up_at is not null;

create table if not exists trial_lead_notes (
  id uuid primary key default gen_random_uuid(),
  trial_lead_id uuid not null references trial_leads (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists trial_lead_notes_lead_id_idx
  on trial_lead_notes (trial_lead_id);

create index if not exists trial_lead_notes_created_at_idx
  on trial_lead_notes (created_at);

alter table trial_leads enable row level security;
alter table trial_lead_notes enable row level security;
