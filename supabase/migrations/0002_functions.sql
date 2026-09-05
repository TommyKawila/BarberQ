create or replace function create_appointment(
  p_barber_id uuid,
  p_customer_ref text,
  p_customer_name text,
  p_customer_phone text,
  p_start_time timestamptz
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
      and a.status = 'confirmed'
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
    barber_id, customer_ref, customer_name, customer_phone, start_time, end_time, status
  ) values (
    p_barber_id, p_customer_ref, p_customer_name, p_customer_phone, p_start_time, v_end, 'confirmed'
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function create_block(
  p_barber_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_reason text
) returns blocked_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row blocked_slots;
begin
  if not exists (select 1 from barbers where id = p_barber_id) then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'INVALID_RANGE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text, 0));

  if exists (
    select 1 from appointments a
    where a.barber_id = p_barber_id
      and a.status = 'confirmed'
      and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (
    select 1 from blocked_slots b
    where b.barber_id = p_barber_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  insert into blocked_slots (barber_id, start_time, end_time, reason)
  values (p_barber_id, p_start_time, p_end_time, coalesce(p_reason, 'walk-in'))
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function cancel_appointment(
  p_appointment_id uuid,
  p_customer_ref text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
begin
  select * into v_row
  from appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_row.customer_ref is distinct from p_customer_ref then
    raise exception 'NOT_OWNER';
  end if;

  if v_row.status is distinct from 'confirmed' then
    raise exception 'NOT_CANCELLABLE';
  end if;

  if v_row.start_time - now() < interval '30 minutes' then
    raise exception 'TOO_LATE';
  end if;

  update appointments
  set status = 'cancelled'
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function get_busy_intervals(
  p_barber_id uuid,
  p_from timestamptz,
  p_to timestamptz
) returns table (start_time timestamptz, end_time timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.start_time, a.end_time
  from appointments a
  where a.barber_id = p_barber_id
    and a.status = 'confirmed'
    and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_from, p_to, '[)')
  union all
  select b.start_time, b.end_time
  from blocked_slots b
  where b.barber_id = p_barber_id
    and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_from, p_to, '[)');
$$;
