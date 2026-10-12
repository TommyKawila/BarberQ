-- D5: snapshot service + price on appointments when marked completed.

alter table appointments
  add column if not exists service_id uuid references shop_services (id) on delete set null,
  add column if not exists price_baht integer check (price_baht is null or price_baht >= 0);

create index if not exists appointments_service_idx on appointments (service_id)
  where service_id is not null;

-- Extend outcome RPC: optional service_id / price_baht; on completed, snapshot
-- explicit price, else shop default service price, else leave null.
create or replace function mark_appointment_outcome(
  p_appointment_id uuid,
  p_status text,
  p_service_id uuid default null,
  p_price_baht integer default null
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointments;
  v_new_end timestamptz;
  v_shop_id uuid;
  v_service_id uuid;
  v_price_baht integer;
begin
  if p_status not in ('completed', 'no_show', 'left') then
    raise exception 'INVALID_OUTCOME';
  end if;

  if p_price_baht is not null and p_price_baht < 0 then
    raise exception 'INVALID_PRICE';
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

  if p_status = 'no_show' and v_row.end_time > now() then
    raise exception 'INVALID_OUTCOME';
  end if;

  v_new_end := v_row.end_time;
  if p_status in ('completed', 'left')
     and now() >= v_row.start_time
     and now() < v_row.end_time
  then
    v_new_end := greatest(now(), v_row.start_time + interval '1 second');
  end if;

  v_service_id := v_row.service_id;
  v_price_baht := v_row.price_baht;

  if p_status = 'completed' then
    select b.shop_id into v_shop_id from barbers b where b.id = v_row.barber_id;

    if p_service_id is not null then
      select s.id, s.price_baht into v_service_id, v_price_baht
      from shop_services s
      where s.id = p_service_id
        and s.shop_id = v_shop_id
        and s.is_active
      limit 1;
      if not found then
        raise exception 'SERVICE_NOT_FOUND';
      end if;
      if p_price_baht is not null then
        v_price_baht := p_price_baht;
      end if;
    elsif p_price_baht is not null then
      v_price_baht := p_price_baht;
    elsif v_price_baht is null then
      select s.id, s.price_baht into v_service_id, v_price_baht
      from shop_services s
      where s.shop_id = v_shop_id
        and s.is_active
      order by s.is_default desc, s.sort_order asc, s.created_at asc
      limit 1;
    end if;
  end if;

  update appointments
  set
    status = p_status,
    end_time = v_new_end,
    completed_at = case when p_status = 'completed' then now() else completed_at end,
    cancelled_at = case when p_status = 'left' then now() else cancelled_at end,
    service_id = case when p_status = 'completed' then v_service_id else service_id end,
    price_baht = case when p_status = 'completed' then v_price_baht else price_baht end
  where id = p_appointment_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function mark_appointment_outcome(uuid, text) from public;
revoke all on function mark_appointment_outcome(uuid, text, uuid, integer) from public;
grant execute on function mark_appointment_outcome(uuid, text, uuid, integer) to service_role;

-- Keep 2-arg overload for older callers (forwards to 4-arg).
create or replace function mark_appointment_outcome(
  p_appointment_id uuid,
  p_status text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
begin
  return mark_appointment_outcome(p_appointment_id, p_status, null, null);
end;
$$;

revoke all on function mark_appointment_outcome(uuid, text) from public;
grant execute on function mark_appointment_outcome(uuid, text) to service_role;
