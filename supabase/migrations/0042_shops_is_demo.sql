-- Demo / marketing tenant flag (ClipperQ Demo). App skips LINE pushes when true.
alter table shops
  add column if not exists is_demo boolean not null default false;

comment on column shops.is_demo is
  'Marketing/demo tenant: no LINE pushes, not billed. Seeded by supabase/scripts/seed_clipperq_demo_prod.sql';
