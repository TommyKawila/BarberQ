insert into barbers (id, name, slot_duration_minutes, off_days)
values
  ('11111111-1111-4111-8111-111111111111', 'Saeb', 30, '{}'),
  ('22222222-2222-4222-8222-222222222222', 'Tide', 45, '{1}'),
  ('33333333-3333-4333-8333-333333333333', 'Nat', 60, '{4}')
on conflict (id) do update
set
  name = excluded.name,
  slot_duration_minutes = excluded.slot_duration_minutes,
  off_days = excluded.off_days;
