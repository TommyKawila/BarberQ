"use client";

import Link from "next/link";
import { buildTrialHref, readStashedAttribution } from "@/lib/marketing/attribution";
import { trackMarketingEvent, type MarketingEventName } from "@/lib/marketing/events";

export function MarketingTrialLink({
  children,
  className,
  placement,
  eventName = "sales_cta_click",
}: {
  children: React.ReactNode;
  className?: string;
  /** Where on the page this CTA sits (Clarity tag). */
  placement?: string;
  eventName?: Extract<MarketingEventName, "sales_cta_click" | "sticky_cta_click">;
}) {
  return (
    <Link
      href="/trial"
      onClick={(e) => {
        e.preventDefault();
        trackMarketingEvent(eventName, {
          destination: "/trial",
          ...(placement ? { cta_location: placement } : {}),
        });
        window.location.assign(
          buildTrialHref(window.location.search, readStashedAttribution()),
        );
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
