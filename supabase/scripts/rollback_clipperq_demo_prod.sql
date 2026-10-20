-- Rollback / delete ClipperQ Demo shop seeded by seed_clipperq_demo_prod.sql
-- Cascades remove barbers, shop_settings, shop_services (FK on delete cascade).
-- Only deletes the fixed demo id when is_demo = true (never by slug alone).
-- Safe to re-run.

begin;

delete from shops
where id = 'c1a55e00-d300-4000-a000-000000000001'
  and is_demo = true;

commit;

-- Verification (expect 0 rows for the fixed demo id)
select id, name, slug, is_demo
from shops
where id = 'c1a55e00-d300-4000-a000-000000000001';

select id, name from barbers where id in (
  'c1a55e00-d300-4000-a000-000000000011',
  'c1a55e00-d300-4000-a000-000000000012',
  'c1a55e00-d300-4000-a000-000000000013',
  'c1a55e00-d300-4000-a000-000000000014'
);
select id, name from shop_services where id in (
  'c1a55e00-d300-4000-a000-000000000021',
  'c1a55e00-d300-4000-a000-000000000022'
);
