-- Manual / idempotent seed for production ClipperQ Demo shop.
-- NOT an auto migration — Tommy runs this in the prod SQL editor.
-- Slug matches create_shop naming: lower(replace('ClipperQ Demo',' ','')) = clipperqdemo
-- PR #20 used display name "ClipperQ Demo" only (no shop row).

begin;

-- Demo flag: skip LINE pushes / treat as non-billable in app code.
alter table shops
  add column if not exists is_demo boolean not null default false;

comment on column shops.is_demo is
  'Marketing/demo tenant: no LINE pushes, not billed. Seeded by supabase/scripts/seed_clipperq_demo_prod.sql';

-- Fixed UUIDs for idempotent re-runs
-- shop  c1a55e00-d300-4000-a000-000000000001
-- barbers …011 …014
-- services …021 …022

insert into shops (id, name, slug, status, subscribed_until, is_demo)
values (
  'c1a55e00-d300-4000-a000-000000000001',
  'ClipperQ Demo',
  'clipperqdemo',
  'active',
  null,
  true
)
on conflict (slug) do nothing;

-- Ensure flag/name if row already existed from a partial run
update shops
set
  is_demo = true,
  name = 'ClipperQ Demo',
  status = 'active',
  updated_at = now()
where slug = 'clipperqdemo';

insert into shop_settings (shop_id, shop_name, hours, shop_line_url, shop_phone)
values (
  'c1a55e00-d300-4000-a000-000000000001',
  'ClipperQ Demo',
  '[
    {"closed": false, "open": "10:00", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:30", "close": "20:00"},
    {"closed": false, "open": "10:00", "close": "20:00"}
  ]'::jsonb,
  null,
  null
)
on conflict (shop_id) do nothing;

-- No owner LINE id. Fictional barber names only.
insert into barbers (
  id, shop_id, name, line_id, role,
  slot_duration_minutes, off_days, is_bookable, is_active
) values
  (
    'c1a55e00-d300-4000-a000-000000000011',
    'c1a55e00-d300-4000-a000-000000000001',
    'มิกซ์ (ตัวอย่าง)',
    null,
    'owner',
    30,
    '{}',
    true,
    true
  ),
  (
    'c1a55e00-d300-4000-a000-000000000012',
    'c1a55e00-d300-4000-a000-000000000001',
    'โอ๊ต (ตัวอย่าง)',
    null,
    'barber',
    45,
    '{}',
    true,
    true
  ),
  (
    'c1a55e00-d300-4000-a000-000000000013',
    'c1a55e00-d300-4000-a000-000000000001',
    'เจ (ตัวอย่าง)',
    null,
    'barber',
    30,
    '{3}',
    true,
    true
  ),
  (
    'c1a55e00-d300-4000-a000-000000000014',
    'c1a55e00-d300-4000-a000-000000000001',
    'นนท์ (ตัวอย่าง)',
    null,
    'barber',
    60,
    '{}',
    true,
    true
  )
on conflict (id) do nothing;

insert into shop_services (
  id, shop_id, name, price_baht, is_default, is_active, sort_order
) values
  (
    'c1a55e00-d300-4000-a000-000000000021',
    'c1a55e00-d300-4000-a000-000000000001',
    'ตัดผม + เฟด',
    200,
    true,
    true,
    0
  ),
  (
    'c1a55e00-d300-4000-a000-000000000022',
    'c1a55e00-d300-4000-a000-000000000001',
    'ตัด + เฟด + โกนหนวด',
    250,
    false,
    true,
    1
  )
on conflict (id) do nothing;

-- Explicitly no LINE OA credentials / no customer data.
-- (Do not insert into shop_line_channels, appointments, blocked_slots, customers.)

commit;

-- ── Verification ──────────────────────────────────────────────
select
  s.id,
  s.name,
  s.slug,
  s.status,
  s.is_demo,
  s.subscribed_until,
  (select count(*) from barbers b where b.shop_id = s.id) as barber_count,
  (select count(*) from shop_services sv where sv.shop_id = s.id) as service_count,
  (select count(*) from shop_line_channels c where c.shop_id = s.id) as line_channel_count,
  (select count(*) from barbers b where b.shop_id = s.id and b.line_id is not null) as barbers_with_line
from shops s
where s.slug = 'clipperqdemo';

select b.id, b.name, b.role, b.line_id, b.slot_duration_minutes, b.is_bookable
from barbers b
join shops s on s.id = b.shop_id
where s.slug = 'clipperqdemo'
order by b.name;

select sv.name, sv.price_baht, sv.is_default, sv.is_active
from shop_services sv
join shops s on s.id = sv.shop_id
where s.slug = 'clipperqdemo'
order by sv.sort_order;
