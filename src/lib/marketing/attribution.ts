const STORAGE_KEY = "barberqx_attribution";

export interface MarketingAttribution {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  locale?: string | null;
}

function trimCap(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function captureAttributionFromSearch(
  search: string,
  referrer?: string | null,
  locale?: string | null,
): MarketingAttribution {
  const params = new URLSearchParams(search);
  return {
    utmSource: trimCap(params.get("utm_source"), 200),
    utmMedium: trimCap(params.get("utm_medium"), 200),
    utmCampaign: trimCap(params.get("utm_campaign"), 200),
    referrer: trimCap(referrer ?? null, 500),
    locale: locale === "en" ? "en" : locale === "th" ? "th" : null,
  };
}

export function stashAttribution(data: MarketingAttribution): void {
  if (typeof sessionStorage === "undefined") return;
  const hasValue = Object.values(data).some((v) => v);
  if (!hasValue) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readStashedAttribution(): MarketingAttribution {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MarketingAttribution;
  } catch {
    return {};
  }
}
