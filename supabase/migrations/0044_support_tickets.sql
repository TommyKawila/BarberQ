-- ClipperQ in-app support tickets (Round 1).
-- Numbered after PR #26's 0043_onboarding_billing.sql — Tommy runs migrations.

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  reporter_line_user_id text not null,
  reporter_staff_id text,
  reporter_name text,
  type text not null check (type in ('setup_help', 'problem', 'feature', 'crash')),
  status text not null default 'new' check (
    status in ('new', 'in_progress', 'done', 'wont_do')
  ),
  body text not null default '',
  page_path text,
  device_info text,
  error_message text,
  error_digest text,
  app_version text,
  error_fingerprint text,
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  last_occurred_at timestamptz not null default now(),
  screenshot_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_shop_created_idx
  on support_tickets (shop_id, created_at desc);

create index if not exists support_tickets_status_type_idx
  on support_tickets (status, type, created_at desc);

create index if not exists support_tickets_fingerprint_idx
  on support_tickets (shop_id, error_fingerprint)
  where error_fingerprint is not null and type = 'crash';

create table if not exists support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  author_role text not null check (author_role in ('operator', 'owner')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_replies_ticket_idx
  on support_ticket_replies (ticket_id, created_at asc);

alter table support_tickets enable row level security;
alter table support_ticket_replies enable row level security;

-- Private screenshot storage (service role only; no public policies)
insert into storage.buckets (id, name, public)
values ('support-screenshots', 'support-screenshots', false)
on conflict (id) do update set public = excluded.public;
