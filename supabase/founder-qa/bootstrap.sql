-- QA-project-only bootstrap for SPR-004.
-- Do NOT apply to Production / PHINX. Not part of numbered supabase/migrations.

insert into shops (id, name, slug, status, subscribed_until)
values (
  'c0a1b2c3-d4e5-4f60-8a11-00000000f001',
  'BarberQ Pilot Test',
  'barberqpilottest',
  'pending',
  now() + interval '12 months'
)
on conflict (id) do nothing;

insert into shops (id, name, slug, status, subscribed_until)
values (
  'c0a1b2c3-d4e5-4f60-8a11-00000000f002',
  'BarberQ Isolation Sentinel',
  'barberqisolationsentinel',
  'active',
  now() + interval '12 months'
)
on conflict (id) do nothing;

insert into shop_settings (shop_id, shop_name, hours)
values (
  'c0a1b2c3-d4e5-4f60-8a11-00000000f001',
  'BarberQ Pilot Test',
  '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb
)
on conflict (shop_id) do nothing;

insert into shop_settings (shop_id, shop_name, hours)
values (
  'c0a1b2c3-d4e5-4f60-8a11-00000000f002',
  'BarberQ Isolation Sentinel',
  '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb
)
on conflict (shop_id) do nothing;

insert into barbers (
  id, shop_id, name, role, slot_duration_minutes, off_days, is_bookable, is_active, line_id
) values
  ('c0a1b2c3-d4e5-4f60-8a11-00000000b001', 'c0a1b2c3-d4e5-4f60-8a11-00000000f001', 'Johnny', 'barber', 30, '{}', true, true, null),
  ('c0a1b2c3-d4e5-4f60-8a11-00000000b002', 'c0a1b2c3-d4e5-4f60-8a11-00000000f001', 'Peter', 'barber', 30, '{}', true, true, null),
  ('c0a1b2c3-d4e5-4f60-8a11-00000000b003', 'c0a1b2c3-d4e5-4f60-8a11-00000000f001', 'Jack', 'barber', 30, '{}', true, true, null),
  ('c0a1b2c3-d4e5-4f60-8a11-00000000b101', 'c0a1b2c3-d4e5-4f60-8a11-00000000f002', 'Sentinel Barber', 'barber', 30, '{}', true, true, null)
on conflict (id) do nothing;
