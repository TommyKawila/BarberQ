alter table appointments
  add column if not exists cancel_token text,
  add column if not exists late_called_at timestamptz;

create unique index if not exists appointments_cancel_token_idx
  on appointments (cancel_token) where cancel_token is not null;

alter table shop_settings
  add column if not exists shop_line_url text,
  add column if not exists shop_phone text;

update appointments
set cancel_token = replace(gen_random_uuid()::text, '-', '')
where cancel_token is null;

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
    barber_id, customer_ref, customer_name, customer_phone, start_time, end_time, status, cancel_token
  ) values (
    p_barber_id, p_customer_ref, p_customer_name, p_customer_phone, p_start_time, v_end, 'confirmed',
    replace(gen_random_uuid()::text, '-', '')
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
      and a.status in ('confirmed', 'completed')
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

  if v_row.start_time - now() < interval '60 minutes' then
    raise exception 'TOO_LATE';
  end if;

  update appointments
  set status = 'cancelled', cancelled_at = now()
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
    and a.status in ('confirmed', 'completed')
    and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_from, p_to, '[)')
  union all
  select b.start_time, b.end_time
  from blocked_slots b
  where b.barber_id = p_barber_id
    and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_from, p_to, '[)');
$$;

create or replace function cancel_appointment_by_token(
  p_cancel_token text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
begin
  if p_cancel_token is null or length(trim(p_cancel_token)) = 0 then
    raise exception 'NOT_FOUND';
  end if;

  select * into v_row
  from appointments
  where cancel_token = p_cancel_token
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_row.status is distinct from 'confirmed' then
    raise exception 'NOT_CANCELLABLE';
  end if;

  if v_row.start_time - now() < interval '60 minutes' then
    raise exception 'TOO_LATE';
  end if;

  update appointments
  set status = 'cancelled', cancelled_at = now()
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function mark_late_called(
  p_appointment_id uuid
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

  if v_row.status is distinct from 'confirmed' then
    raise exception 'NOT_CANCELLABLE';
  end if;

  update appointments
  set late_called_at = coalesce(late_called_at, now())
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function cancel_appointment_by_token(text) from public;
grant execute on function cancel_appointment_by_token(text) to service_role;

revoke all on function mark_late_called(uuid) from public;
grant execute on function mark_late_called(uuid) to service_role;
