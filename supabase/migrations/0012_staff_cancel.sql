create or replace function staff_cancel_appointment(
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
  set status = 'cancelled', cancelled_at = now()
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function staff_cancel_appointment(uuid) from public;
grant execute on function staff_cancel_appointment(uuid) to service_role;
