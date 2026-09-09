create table if not exists line_oa_install_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  line_oa text not null,
  rich_menu_state text not null check (rich_menu_state in ('existing', 'none', 'unsure')),
  help_type text not null check (help_type in ('add_to_existing', 'new_menu', 'recommend')),
  contact_phone text not null,
  status text not null default 'NEW' check (
    status in ('NEW', 'CONTACTED', 'IN_PROGRESS', 'DONE', 'CANCELLED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists line_oa_install_requests_shop_id_idx
  on line_oa_install_requests (shop_id, created_at desc);

create index if not exists line_oa_install_requests_status_idx
  on line_oa_install_requests (status)
  where status in ('NEW', 'CONTACTED', 'IN_PROGRESS');
