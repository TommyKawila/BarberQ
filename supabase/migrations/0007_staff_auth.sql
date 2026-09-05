create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('barber', 'super_admin')),
  token text not null unique,
  barber_id uuid references barbers (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_token_idx on staff (token) where active = true;

alter table staff enable row level security;
