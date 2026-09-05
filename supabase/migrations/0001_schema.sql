create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slot_duration_minutes integer not null check (slot_duration_minutes > 0),
  off_days integer[] not null default '{}',
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete restrict,
  customer_ref text not null,
  customer_name text not null,
  customer_phone text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table blocked_slots (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text not null default 'walk-in',
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table appointments add constraint appointments_no_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status = 'confirmed');

alter table blocked_slots add constraint blocked_slots_no_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  );

create index appointments_barber_start_idx on appointments (barber_id, start_time);
create index blocked_slots_barber_start_idx on blocked_slots (barber_id, start_time);
