-- Persist shop owner manual confirmation that OA auto-reply / greeting is off.
-- LINE Messaging API cannot report this setting (see connection-test + admin LINE page).
alter table shop_line_channels
  add column if not exists auto_reply_confirmed_at timestamptz;
