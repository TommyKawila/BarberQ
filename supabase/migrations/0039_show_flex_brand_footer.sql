-- ClipperQ Brand Guide v1.0: optional "by ClipperQ" footer on customer LINE Flex cards.
-- Default ON (shown); shops may turn OFF in admin LINE/message settings.

alter table shop_settings
  add column if not exists show_flex_brand_footer boolean not null default true;
