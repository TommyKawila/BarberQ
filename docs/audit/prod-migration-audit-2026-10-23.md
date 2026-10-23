# Prod migration audit (barber-q / read-only) — 2026-10-23

Compared `supabase/migrations/*.sql` (0001–0046; **no 0043/0044/0047 in repo**) against production schema via Supabase read-only MCP.

## Verdict

| Status | Migrations |
| --- | --- |
| **Present** (markers found) | 0001–0025, 0028–0042, 0045–0046 |
| **Missing / incomplete** | **0026**, **0027** |
| Seed / optional data only | 0004, 0008, 0040 |
| RLS grants only | 0003 |
| On prod but **not** in repo migrations | `shop_payment_slips` |

**Root of LIFF 「จองไม่สำเร็จ」:** `appointments.source` and `create_appointment(..., p_source, p_end_time)` from **0026/0027** never landed on prod. Later migrations (0032–0038, 0041–0046) **did** apply, so history was not “stopped at 0025” — 0026 was skipped or failed while later files continued.

### Missing markers (prod)

| Object | Expected by | Present? |
| --- | --- | --- |
| column `appointments.source` | 0026 | **NO** |
| constraint `appointments_source_check` | 0026 | **NO** |
| index `appointments_source_idx` | 0026 | **NO** |
| `create_appointment(..., p_source, p_end_time)` | 0026/0027 | **NO** (only 0013 6-arg) |
| `appointments_status_check` includes `'left'` | 0026 | **NO** (confirmed/cancelled/completed/no_show only) |
| `customer_ref` / `customer_phone` nullable | 0026 | **NO** (both `NOT NULL`) |
| `mark_appointment_outcome(uuid, text)` supports `'left'` | 0026/0027 | **NO** (2-arg body has no `left`; 4-arg from 0032 does) |

Catch-up script (idempotent): `supabase/scripts/prod_catchup_0026_0027.sql`.

---

## Reusable read-only checks (run on prod)

### A. One-shot marker matrix

```sql
-- Paste into Supabase SQL editor (read-only / select).
with markers(migration, kind, name) as (values
  ('0001','table','barbers'),('0001','table','appointments'),('0001','table','blocked_slots'),
  ('0005','table','shop_settings'),('0007','table','staff'),('0009','table','recurring_breaks'),
  ('0014','table','shops'),('0019','table','line_oa_install_requests'),
  ('0023','table','trial_leads'),('0024','table','trial_lead_notes'),
  ('0025','table','shop_managers'),('0025','table','shop_manager_invites'),
  ('0026','column','appointments.source'),
  ('0028','table','shop_line_channels'),
  ('0029','table','line_message_log'),('0029','table','line_webhook_events'),
  ('0030','table','web_push_subscriptions'),
  ('0031','table','shop_services'),
  ('0038','table','qr_queue_entries'),
  ('0041','table','barber_line_invites'),
  ('0046','table','shop_cancel_feedback'),
  ('extra','table','shop_payment_slips'),
  ('0013','column','appointments.customer_line_id'),
  ('0016','column','shops.slug'),
  ('0017','column','shop_settings.hours'),
  ('0020','column','barbers.is_active'),
  ('0026','column','appointments.source'),
  ('0032','column','appointments.price_baht'),
  ('0033','column','appointments.reminder_due_at'),
  ('0034','column','appointments.reschedule_count'),
  ('0038','column','appointments.via_qr'),
  ('0042','column','shops.is_demo'),
  ('0045','column','shops.barber_tier'),
  ('0026','index','appointments_source_idx'),
  ('0026','constraint','appointments_source_check')
)
select m.migration, m.kind, m.name,
  case m.kind
    when 'table' then exists(
      select 1 from information_schema.tables t
      where t.table_schema='public' and t.table_name=m.name)
    when 'column' then exists(
      select 1 from information_schema.columns c
      where c.table_schema='public'
        and c.table_name=split_part(m.name,'.',1)
        and c.column_name=split_part(m.name,'.',2))
    when 'index' then exists(
      select 1 from pg_indexes i where i.schemaname='public' and i.indexname=m.name)
    when 'constraint' then exists(
      select 1 from pg_constraint x
      where x.connamespace='public'::regnamespace and x.conname=m.name)
  end as present
from markers m
order by 1,2,3;
```

### B. Functions + create_appointment signature (critical)

```sql
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_appointment','mark_appointment_outcome','get_busy_intervals',
    'cancel_appointment','staff_cancel_appointment','cancel_appointment_by_token',
    'reschedule_appointment_by_token','staff_reschedule_appointment',
    'create_shop_invite','create_shop_with_owner','claim_owner_invite',
    'create_manager_invite','claim_manager_invite',
    'create_barber_line_invite','claim_barber_line_invite'
  )
order by 1,2;

-- Expect after catch-up:
-- create_appointment(..., p_customer_line_id, p_source, p_end_time)
select exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='create_appointment'
    and pg_get_function_identity_arguments(p.oid)
      = 'p_barber_id uuid, p_customer_ref text, p_customer_name text, p_customer_phone text, p_start_time timestamp with time zone, p_customer_line_id text, p_source text, p_end_time timestamp with time zone'
) as has_0026_create_appointment;
```

### C. 0026 status / nullability

```sql
select pg_get_constraintdef(oid) as appointments_status_check
from pg_constraint where conname = 'appointments_status_check';
-- want: ..., 'left'

select column_name, is_nullable
from information_schema.columns
where table_schema='public' and table_name='appointments'
  and column_name in ('source','customer_ref','customer_phone')
order by 1;
```

---

## Per-migration object inventory + targeted checks

Legend: **OK** = present on prod (2026-10-23 probe). **MISSING** = not present. **N/A** = seed/RLS-only.

| File | Creates / changes | Prod | Check SQL (object-focused) |
| --- | --- | --- | --- |
| **0001_schema** | tables `barbers`,`appointments`,`blocked_slots`; indexes `appointments_barber_start_idx`,`blocked_slots_barber_start_idx`; exclusion `appointments_no_overlap`,`blocked_slots_no_overlap` | **OK** | `select to_regclass('public.appointments');` |
| **0002_functions** | fns `create_appointment`,`create_block`,`cancel_appointment`,`get_busy_intervals` | **OK** (older sig) | see §B |
| **0003_rls** | RLS enable + grants | **OK** (assumed; tables RLS on) | `select relname, relrowsecurity from pg_class where relname='appointments';` |
| **0004_seed_barbers** | seed data | N/A | — |
| **0005_shop_settings** | table `shop_settings` | **OK** | `select to_regclass('public.shop_settings');` |
| **0006_shop_name** | col `shop_settings.shop_name` | **OK** | `select column_name from information_schema.columns where table_name='shop_settings' and column_name='shop_name';` |
| **0007_staff_auth** | table `staff`, index `staff_token_idx` | **OK** | `select to_regclass('public.staff');` |
| **0008_seed_staff** | seed | N/A | — |
| **0009_recurring_breaks** | table `recurring_breaks` | **OK** | `select to_regclass('public.recurring_breaks');` |
| **0010_appointment_outcome** | col `completed_at`; fn `mark_appointment_outcome`; status check; index | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name='completed_at';` |
| **0011_booking_policy** | cols `cancel_token`,`shop_line_url`; fns `cancel_appointment_by_token`,`mark_late_called` | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name='cancel_token';` |
| **0012_staff_cancel** | fn `staff_cancel_appointment` | **OK** | `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='staff_cancel_appointment';` |
| **0013_line_login** | col `customer_line_id`; 6-arg `create_appointment` | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name='customer_line_id';` |
| **0014_super_admin_system** | table `shops`; cols `barbers.line_id`,`role`,`shop_id`; fns `create_shop_with_owner`,`get_barber_by_line_id` | **OK** | `select to_regclass('public.shops');` |
| **0015_owner_invite** | cols `invite_token`,`invite_expires_at`; fns invite/claim | **OK** | `select column_name from information_schema.columns where table_name='shops' and column_name='invite_token';` |
| **0016_shop_slug** | cols `shops.slug`,`shop_settings.shop_id` | **OK** | `select column_name from information_schema.columns where table_name='shops' and column_name='slug';` |
| **0017_shop_hours_and_barbers** | cols `hours`,`is_bookable` | **OK** | `select column_name from information_schema.columns where table_name='shop_settings' and column_name='hours';` |
| **0018_regenerate_shop_invite** | fn `regenerate_shop_invite` | **OK** | §B |
| **0019_line_oa_install_requests** | table + indexes | **OK** | `select to_regclass('public.line_oa_install_requests');` |
| **0020_barber_is_active** | col `barbers.is_active` | **OK** | `select column_name from information_schema.columns where table_name='barbers' and column_name='is_active';` |
| **0021_barber_profile** | cols `profile_image_url`,`show_profile_in_booking` | **OK** | `select column_name from information_schema.columns where table_name='barbers' and column_name='profile_image_url';` |
| **0022_shop_cover** | col `cover_image_url` | **OK** | `select column_name from information_schema.columns where table_name='shop_settings' and column_name='cover_image_url';` |
| **0023_trial_leads** | table `trial_leads` | **OK** | `select to_regclass('public.trial_leads');` |
| **0024_trial_lead_crm** | table `trial_lead_notes`; col `follow_up_at` | **OK** | `select to_regclass('public.trial_lead_notes');` |
| **0025_shop_managers** | tables `shop_managers`,`shop_manager_invites` + invite fns | **OK** | `select to_regclass('public.shop_managers');` |
| **0026_staff_booking_source** | **source col/constraint/index**; nullable ref/phone; status `left`; **8-arg create_appointment**; outcome w/ left | **MISSING** | §A–§C |
| **0027_fix_outcome_end_time** | replace outcome 2-arg + re-apply 8-arg create_appointment | **MISSING** | §B |
| **0028_shop_line_channels** | table `shop_line_channels` | **OK** | `select to_regclass('public.shop_line_channels');` |
| **0029_line_push_quota** | tables `line_message_log`,`line_webhook_events` | **OK** | `select to_regclass('public.line_message_log');` |
| **0030_web_push** | table `web_push_subscriptions`; col `barber_webpush_scope` | **OK** | `select to_regclass('public.web_push_subscriptions');` |
| **0031_shop_services** | table `shop_services` | **OK** | `select to_regclass('public.shop_services');` |
| **0032_appointment_price** | cols `service_id`,`price_baht`; 4-arg `mark_appointment_outcome` | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name in ('service_id','price_baht');` |
| **0033_appointment_reminders** | reminder cols on settings + appointments | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name='reminder_due_at';` |
| **0034_customer_reschedule** | col `reschedule_count`; reschedule fns | **OK** | `select column_name from information_schema.columns where table_name='appointments' and column_name='reschedule_count';` |
| **0035_push_confirm_kind** | widen `line_message_log_kind_check` | **OK** | `select pg_get_constraintdef(oid) from pg_constraint where conname='line_message_log_kind_check';` |
| **0036_booking_confirm_push_enabled** | col `booking_confirm_push_enabled` | **OK** | `select column_name from information_schema.columns where table_name='shop_settings' and column_name='booking_confirm_push_enabled';` |
| **0037_push_reschedule_ticket_kind** | widen kind check again | **OK** | same as 0035 |
| **0038_qr_walk_in_queue** | table `qr_queue_entries`; cols `via_qr`,`queue_ahead_push_enabled` | **OK** | `select to_regclass('public.qr_queue_entries');` |
| **0039_show_flex_brand_footer** | col `show_flex_brand_footer` | **OK** | `select column_name from information_schema.columns where table_name='shop_settings' and column_name='show_flex_brand_footer';` |
| **0040_clipperq_demo_seed_name** | optional rename PHINX → ClipperQ Demo | N/A (data) | `select name from shops where id='00000000-0000-0000-0000-000000000001';` |
| **0041_barber_line_invites** | table + fns; col `line_display_name` | **OK** | `select to_regclass('public.barber_line_invites');` |
| **0042_shops_is_demo** | col `shops.is_demo` | **OK** | `select column_name from information_schema.columns where table_name='shops' and column_name='is_demo';` |
| **0045_shops_barber_tier** | col `shops.barber_tier` + check | **OK** | `select column_name from information_schema.columns where table_name='shops' and column_name='barber_tier';` |
| **0046_shop_cancel_feedback** | table `shop_cancel_feedback` | **OK** | `select to_regclass('public.shop_cancel_feedback');` |

**Not in repo:** `0043`, `0044`, `0047`. Prod has **`shop_payment_slips`** (no matching migration file here) — treat as applied out-of-band.

---

## Recommended ops order

1. Run §A–§C on prod to reconfirm.  
2. Apply `supabase/scripts/prod_catchup_0026_0027.sql` in a maintenance window (idempotent; safe to re-run).  
3. Re-run §B/`has_0026_create_appointment` and book once via LIFF.  
4. Optionally record the script in Supabase migration history if you use `supabase_migrations.schema_migrations`.
