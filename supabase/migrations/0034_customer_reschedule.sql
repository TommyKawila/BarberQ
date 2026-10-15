-- P6: customer self-reschedule + shop atomic move
-- Max 1 customer reschedule per booking (reschedule_count).
-- Same 60-minute lead as cancel (0011_booking_policy.sql).
-- Atomic: reserve new slot and release old in one transaction.

alter table appointments
  add column if not exists reschedule_count integer not null default 0;

alter table appointments
  drop constraint if exists appointments_reschedule_count_max;

alter table appointments
  add constraint appointments_reschedule_count_max
  check (reschedule_count >= 0 and reschedule_count <= 1);

comment on column appointments.reschedule_count is
  'Customer self-reschedule count; max 1. Shop staff moves do not increment.';

create or replace function reschedule_appointment_by_token(
  p_cancel_token text,
  p_new_barber_id uuid,
  p_new_start_time timestamptz
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
  v_old_barber_id uuid;
  v_new_barber barbers;
  v_end timestamptz;
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
    raise exception 'NOT_RESCHEDULABLE';
  end if;

  if coalesce(v_row.reschedule_count, 0) >= 1 then
    raise exception 'RESCHEDULE_LIMIT';
  end if;

  -- Same lead as cancel: 60 minutes before the *original* appointment.
  if v_row.start_time - now() < interval '60 minutes' then
    raise exception 'TOO_LATE';
  end if;

  select * into v_new_barber from barbers where id = p_new_barber_id;
  if not found then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  if v_new_barber.is_active is false or v_new_barber.is_bookable is false then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  v_end := p_new_start_time + (v_new_barber.slot_duration_minutes || ' minutes')::interval;
  if v_end <= p_new_start_time then
    raise exception 'INVALID_RANGE';
  end if;

  v_old_barber_id := v_row.barber_id;

  -- Lock both barbers (stable order) so we never drop the old slot without holding the new one.
  if v_old_barber_id::text < p_new_barber_id::text then
    perform pg_advisory_xact_lock(hashtextextended(v_old_barber_id::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
  elsif v_old_barber_id::text > p_new_barber_id::text then
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(v_old_barber_id::text, 0));
  else
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
  end if;

  if exists (
    select 1 from appointments a
    where a.barber_id = p_new_barber_id
      and a.id is distinct from v_row.id
      and a.status in ('confirmed', 'completed')
      and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_new_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (
    select 1 from blocked_slots b
    where b.barber_id = p_new_barber_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_new_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  update appointments
  set
    barber_id = p_new_barber_id,
    start_time = p_new_start_time,
    end_time = v_end,
    reschedule_count = coalesce(reschedule_count, 0) + 1
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function staff_reschedule_appointment(
  p_appointment_id uuid,
  p_new_barber_id uuid,
  p_new_start_time timestamptz
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
  v_old_barber_id uuid;
  v_new_barber barbers;
  v_end timestamptz;
begin
  select * into v_row
  from appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_row.status is distinct from 'confirmed' then
    raise exception 'NOT_RESCHEDULABLE';
  end if;

  select * into v_new_barber from barbers where id = p_new_barber_id;
  if not found then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  if v_new_barber.is_active is false then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  v_end := p_new_start_time + (v_new_barber.slot_duration_minutes || ' minutes')::interval;
  if v_end <= p_new_start_time then
    raise exception 'INVALID_RANGE';
  end if;

  v_old_barber_id := v_row.barber_id;

  if v_old_barber_id::text < p_new_barber_id::text then
    perform pg_advisory_xact_lock(hashtextextended(v_old_barber_id::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
  elsif v_old_barber_id::text > p_new_barber_id::text then
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(v_old_barber_id::text, 0));
  else
    perform pg_advisory_xact_lock(hashtextextended(p_new_barber_id::text, 0));
  end if;

  if exists (
    select 1 from appointments a
    where a.barber_id = p_new_barber_id
      and a.id is distinct from v_row.id
      and a.status in ('confirmed', 'completed')
      and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_new_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (
    select 1 from blocked_slots b
    where b.barber_id = p_new_barber_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_new_start_time, v_end, '[)')
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  -- Staff move does not increment reschedule_count (customer keeps their 1 self-reschedule).
  update appointments
  set
    barber_id = p_new_barber_id,
    start_time = p_new_start_time,
    end_time = v_end
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function reschedule_appointment_by_token(text, uuid, timestamptz) from public;
grant execute on function reschedule_appointment_by_token(text, uuid, timestamptz) to service_role;

revoke all on function staff_reschedule_appointment(uuid, uuid, timestamptz) from public;
grant execute on function staff_reschedule_appointment(uuid, uuid, timestamptz) to service_role;
