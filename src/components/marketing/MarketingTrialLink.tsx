"use client";

import Link from "next/link";
import { buildTrialHref, readStashedAttribution } from "@/lib/marketing/attribution";
import { trackMarketingEvent } from "@/lib/marketing/events";

export function MarketingTrialLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/trial"
      onClick={(e) => {
        e.preventDefault();
        trackMarketingEvent("sales_cta_click", { destination: "/trial" });
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
