-- At most one active walk-in (waiting OR started) per customer per shop.
-- Previously uniqueness was only for status = 'waiting', so after "เริ่มตัด"
-- (status → started) the same LINE user could join again.
--
-- Tommy: run docs/sql/0052-precheck.sql (read-only check + optional cleanup)
-- on the target DB before/with this migration. Production by Tommy only.

begin;

-- Prefer started over waiting: cancel waiting rows that duplicate a started entry.
update qr_queue_entries q
set
  status = 'cancelled',
  updated_at = now()
where q.status = 'waiting'
  and exists (
    select 1
    from qr_queue_entries s
    where s.shop_id = q.shop_id
      and s.customer_line_id = q.customer_line_id
      and s.status = 'started'
      and s.id is distinct from q.id
  );

-- Any remaining duplicate actives: keep one (prefer started, then newest), cancel rest.
with ranked as (
  select
    id,
    row_number() over (
      partition by shop_id, customer_line_id
      order by
        case when status = 'started' then 0 else 1 end,
        updated_at desc,
        created_at desc,
        id desc
    ) as rn
  from qr_queue_entries
  where status in ('waiting', 'started')
)
update qr_queue_entries q
set
  status = 'cancelled',
  updated_at = now()
from ranked r
where q.id = r.id
  and r.rn > 1;

-- Create new unique index BEFORE dropping the old one so uniqueness never gaps.
create unique index if not exists qr_queue_one_active_per_customer
  on qr_queue_entries (shop_id, customer_line_id)
  where status in ('waiting', 'started');

drop index if exists qr_queue_one_waiting_per_customer;

commit;
