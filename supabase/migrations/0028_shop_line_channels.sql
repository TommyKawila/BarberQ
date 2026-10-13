-- P4: per-shop LINE Messaging API credentials (encrypted at rest by app).
create table if not exists shop_line_channels (
  shop_id uuid primary key references shops (id) on delete cascade,
  messaging_channel_id text,
  channel_secret_enc text,
  channel_secret_last4 text,
  access_token_enc text,
  access_token_last4 text,
  bot_user_id text,
  bot_display_name text,
  oa_basic_id text,
  login_channel_id text,
  liff_id text,
  plan text not null default 'free'
    check (plan in ('free', 'basic', 'pro', 'unknown')),
  monthly_push_budget integer not null default 300
    check (monthly_push_budget > 0),
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'broken')),
  last_verified_at timestamptz,
  last_error_code text,
  last_error_message text,
  checklist_step integer not null default 1
    check (checklist_step between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_line_channels_status_idx
  on shop_line_channels (status);

alter table shop_line_channels enable row level security;
