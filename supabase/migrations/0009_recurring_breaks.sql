create table recurring_breaks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index recurring_breaks_barber_idx on recurring_breaks (barber_id);

alter table recurring_breaks enable row level security;
