-- P3 follow-up: fix mark_appointment_outcome for future appointments.
-- Bug: setting end_time = now() when now() < start_time violated
-- appointments_check (end_time > start_time), e.g. marking 'left' on a
-- tomorrow walk-in from today's board.
-- Idempotent: create or replace function only. Does not edit 0026.

create or replace function mark_appointment_outcome(
  p_appointment_id uuid,
  p_status text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
  v_new_end timestamptz;
begin
  if p_status not in ('completed', 'no_show', 'left') then
    raise exception 'INVALID_OUTCOME';
  end if;

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

  -- no_show only after scheduled end
  if p_status = 'no_show' and v_row.end_time > now() then
    raise exception 'INVALID_OUTCOME';
  end if;

  -- Shorten end_time only while the appointment is in progress so we free
  -- the remaining slot. Before start: keep original end_time (status left/
  -- completed is non-blocking for overlap — only confirmed/completed block).
  v_new_end := v_row.end_time;
  if p_status in ('completed', 'left')
     and now() >= v_row.start_time
     and now() < v_row.end_time
  then
    v_new_end := greatest(now(), v_row.start_time + interval '1 second');
  end if;

  update appointments
  set
    status = p_status,
    end_time = v_new_end,
    completed_at = case when p_status = 'completed' then now() else completed_at end,
    cancelled_at = case when p_status = 'left' then now() else cancelled_at end
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function mark_appointment_outcome(uuid, text) from public;
grant execute on function mark_appointment_outcome(uuid, text) to service_role;

-- Document / assert: create_appointment overlap already ignores 'left'
-- (status in ('confirmed','completed') only). Re-apply create_appointment
-- unchanged so QA that only ran 0026 keeps the same conflict semantics
-- after 0027, and left remains non-blocking.
create or replace function create_appointment(
  p_barber_id uuid,
  p_customer_ref text,
  p_customer_name text,
  p_customer_phone text,
  p_start_time timestamptz,
  p_customer_line_id text default null,
  p_source text default 'line',
  p_end_time timestamptz default null
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barber barbers;
  v_end timestamptz;
  v_row appointments;
  v_source text;
begin
  select * into v_barber from barbers where id = p_barber_id;
  if not found then
    raise exception 'BARBER_NOT_FOUND';
  end if;

  v_source := coalesce(nullif(trim(p_source), ''), 'line');
  if v_source not in ('line', 'phone', 'chat', 'walk_in') then
    raise exception 'INVALID_SOURCE';
  end if;

  if p_end_time is not null then
    if p_end_time <= p_start_time then
      raise exception 'INVALID_RANGE';
    end if;
    v_end := p_end_time;
  else
    v_end := p_start_time + (v_barber.slot_duration_minutes || ' minutes')::interval;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barber_id::text, 0));

  -- left / cancelled / no_show do not block; only confirmed + completed
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
    start_time, end_time, status, cancel_token, customer_line_id, source
  ) values (
    p_barber_id,
    nullif(trim(p_customer_ref), ''),
    p_customer_name,
    nullif(trim(p_customer_phone), ''),
    p_start_time,
    v_end,
    'confirmed',
    replace(gen_random_uuid()::text, '-', ''),
    p_customer_line_id,
    v_source
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function create_appointment(uuid, text, text, text, timestamptz, text, text, timestamptz) from public;
grant execute on function create_appointment(uuid, text, text, text, timestamptz, text, text, timestamptz) to service_role;
