export type MarketingEventName =
  | "sales_page_view"
  | "sales_cta_click"
  | "how_it_works_click"
  | "trial_page_view"
  | "trial_form_started"
  | "trial_form_submit"
  | "trial_form_success"
  | "trial_form_error"
  | "support_line_click";

export type MarketingEventProps = {
  destination?: string;
  errorCode?: "VALIDATION" | "RATE_LIMIT" | "INTERNAL";
};

const PII_KEYS = /contact|phone|line|name|shop|email|value/i;

export function trackMarketingEvent(
  name: MarketingEventName,
  props?: MarketingEventProps,
): void {
  if (props) {
    for (const key of Object.keys(props)) {
      if (PII_KEYS.test(key)) {
        throw new Error("Marketing events must not include PII props");
      }
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[marketing]", name, props ?? {});
  }
}
