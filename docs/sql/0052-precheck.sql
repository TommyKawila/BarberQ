-- 0052 precheck + optional cleanup (Tommy runs on QA / production — not the agent).
-- Read-only check first; run cleanup only if duplicates exist; then apply
-- supabase/migrations/0052_qr_queue_one_active_per_customer.sql.

-- ========== READ-ONLY: list duplicate active walk-ins ==========
select
  shop_id,
  customer_line_id,
  count(*) as active_count,
  array_agg(id order by created_at) as entry_ids,
  array_agg(status order by created_at) as statuses
from qr_queue_entries
where status in ('waiting', 'started')
group by shop_id, customer_line_id
having count(*) > 1
order by shop_id, customer_line_id;

-- ========== CLEANUP (same logic as migration 0052; safe to re-run) ==========
-- Prefer started over waiting: cancel waiting that duplicates a started row.
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

-- Remaining duplicate actives: keep one (prefer started, then newest).
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

-- Re-check (expect 0 rows):
select
  shop_id,
  customer_line_id,
  count(*) as active_count
from qr_queue_entries
where status in ('waiting', 'started')
group by shop_id, customer_line_id
having count(*) > 1;
