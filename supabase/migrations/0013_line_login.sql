alter table appointments
  add column if not exists customer_line_id text;

create index if not exists appointments_customer_line_id_idx
  on appointments (customer_line_id)
  where customer_line_id is not null;

drop function if exists create_appointment(uuid, text, text, text, timestamptz);

create or replace function create_appointment(
  p_barber_id uuid,
  p_customer_ref text,
  p_customer_name text,
  p_customer_phone text,
  p_start_time timestamptz,
  p_customer_line_id text default null
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barber barbers;
  v_end timestamptz;
  v_row appointments;
begin
  select * into v_barber from barbers where id = p_barber_id;
  if not found then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  v_end := p_start_time + (v_barber.slot_duration_minutes || ' minutes')::interval;

  perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text, 0));

  if exists (
    select 1 from appointments a
    where a.barber_id = p_barber_id
      and a.status in ('confirmed', 'completed')
      and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (
    select 1 from blocked_slots b
    where b.barber_id = p_barber_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  insert into appointments (
    barber_id, customer_ref, customer_name, customer_phone,
    start_time, end_time, status, cancel_token, customer_line_id
  ) values (
    p_barber_id, p_customer_ref, p_customer_name, p_customer_phone,
    p_start_time, v_end, 'confirmed',
    replace(gen_random_uuid()::text, '-', ''),
    p_customer_line_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function create_appointment(uuid, text, text, text, timestamptz, text) from public;
grant execute on function create_appointment(uuid, text, text, text, timestamptz, text) to service_role;
