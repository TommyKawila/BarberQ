alter table shop_settings
  add column if not exists cover_image_url text;

insert into storage.buckets (id, name, public)
values ('shop-covers', 'shop-covers', true)
on conflict (id) do nothing;

create policy "shop_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'shop-covers');
