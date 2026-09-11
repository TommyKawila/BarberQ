"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import { captureMarketingAttribution } from "@/lib/marketing/attribution";

export function AttributionCapture() {
  const { locale } = useI18n();

  useEffect(() => {
    captureMarketingAttribution(window.location.search, document.referrer || null, locale);
  }, [locale]);

  return null;
}
