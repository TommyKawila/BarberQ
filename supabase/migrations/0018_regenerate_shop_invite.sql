create or replace function regenerate_shop_invite(p_shop_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop shops;
  v_token text;
  v_expires timestamptz;
begin
  select * into v_shop from shops where id = p_shop_id limit 1;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_shop.status <> 'pending' then
    raise exception 'INVITE_ALREADY_CLAIMED';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '7 days';

  update shops
  set
    invite_token = v_token,
    invite_expires_at = v_expires,
    updated_at = now()
  where id = p_shop_id;

  return json_build_object(
    'shop_id', p_shop_id,
    'invite_token', v_token,
    'invite_expires_at', v_expires
  );
end;
$$;

revoke all on function regenerate_shop_invite(uuid) from public;
grant execute on function regenerate_shop_invite(uuid) to service_role;
