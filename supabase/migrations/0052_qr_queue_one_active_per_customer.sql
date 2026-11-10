-- At most one active walk-in (waiting OR started) per customer per shop.
-- Previously uniqueness was only for status = 'waiting', so after "เริ่มตัด"
-- (status → started) the same LINE user could join again.

drop index if exists qr_queue_one_waiting_per_customer;

create unique index if not exists qr_queue_one_active_per_customer
  on qr_queue_entries (shop_id, customer_line_id)
  where status in ('waiting', 'started');
