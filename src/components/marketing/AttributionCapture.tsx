"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import { captureAttributionFromSearch, stashAttribution } from "@/lib/marketing/attribution";

export function AttributionCapture() {
  const { locale } = useI18n();

  useEffect(() => {
    const data = captureAttributionFromSearch(
      window.location.search,
      document.referrer || null,
      locale,
    );
    stashAttribution(data);
  }, [locale]);

  return null;
}
