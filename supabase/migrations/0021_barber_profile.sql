alter table barbers
  add column if not exists profile_image_url text,
  add column if not exists show_profile_in_booking boolean not null default false;

insert into storage.buckets (id, name, public)
values ('barber-profiles', 'barber-profiles', true)
on conflict (id) do nothing;

create policy "barber_profiles_public_read"
  on storage.objects for select
  using (bucket_id = 'barber-profiles');
