alter table barbers enable row level security;
alter table appointments enable row level security;
alter table blocked_slots enable row level security;

create policy barbers_select_public
  on barbers
  for select
  to anon, authenticated
  using (true);

revoke all on function create_appointment(uuid, text, text, text, timestamptz) from public;
revoke all on function create_block(uuid, timestamptz, timestamptz, text) from public;
revoke all on function cancel_appointment(uuid, text) from public;
revoke all on function get_busy_intervals(uuid, timestamptz, timestamptz) from public;

grant execute on function create_appointment(uuid, text, text, text, timestamptz) to service_role;
grant execute on function create_block(uuid, timestamptz, timestamptz, text) to service_role;
grant execute on function cancel_appointment(uuid, text) to service_role;
grant execute on function get_busy_intervals(uuid, timestamptz, timestamptz) to anon, authenticated, service_role;
