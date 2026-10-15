-- P6 add-on: customer self-reschedule LINE ticket push kind.
-- Distinct from push_reschedule (shop→customer propose flex).
alter table line_message_log drop constraint if exists line_message_log_kind_check;
alter table line_message_log
  add constraint line_message_log_kind_check
  check (kind in (
    'reply_confirm',
    'reply_ticket',
    'push_cancel',
    'push_reschedule',
    'push_reschedule_ticket',
    'push_reminder',
    'push_confirm',
    'push_test',
    'push_other'
  ));
