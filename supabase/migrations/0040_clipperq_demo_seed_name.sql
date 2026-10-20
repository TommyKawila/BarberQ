-- ClipperQ Admin v3: rename seed shop display name for demos.
-- Slug stays `phinxstudio` (no URL / env changes). Safe to re-run.
-- Tommy: run this on QA/prod only if you want the seed shop labeled "ClipperQ Demo".

update public.shops
set name = 'ClipperQ Demo'
where id = '00000000-0000-0000-0000-000000000001'
  and name = 'PHINX STUDIO';

update public.shop_settings
set shop_name = 'ClipperQ Demo'
where shop_id = '00000000-0000-0000-0000-000000000001'
  and shop_name = 'PHINX STUDIO';
