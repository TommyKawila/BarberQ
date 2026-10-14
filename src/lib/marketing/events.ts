export type MarketingEventName =
  | "sales_page_view"
  | "sales_cta_click"
  | "sticky_cta_click"
  | "pricing_view"
  | "faq_open"
  | "how_it_works_click"
  | "line_section_view"
  | "trial_page_view"
  | "trial_form_started"
  | "trial_form_submit"
  | "trial_form_success"
  | "trial_form_error"
  | "support_line_click";

export type MarketingEventProps = {
  destination?: string;
  /** CTA placement: hero | nav | pricing | line | final | sticky | founder | board */
  cta_location?: string;
  faq_id?: string;
  errorCode?: "VALIDATION" | "RATE_LIMIT" | "INTERNAL";
};

const PII_KEYS = /contact|phone|line|name|shop|email|value/i;

type ClarityApi = {
  (method: "event", name: string): void;
  (method: "set", key: string, value: string | string[]): void;
};

declare global {
  interface Window {
    clarity?: ClarityApi;
  }
}

function sendToClarity(name: MarketingEventName, props?: MarketingEventProps): void {
  if (typeof window === "undefined") return;
  const clarity = window.clarity;
  if (typeof clarity !== "function") return;
  try {
    clarity("event", name);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null) continue;
        clarity("set", key, String(value));
      }
    }
  } catch {
    // Clarity must never break marketing UX
  }
}

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
  sendToClarity(name, props);
}
