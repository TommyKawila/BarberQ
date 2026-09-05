create table shop_settings (
  id integer primary key default 1 check (id = 1),
  logo_data_url text,
  updated_at timestamptz not null default now()
);

insert into shop_settings (id) values (1);

alter table shop_settings enable row level security;
