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

function firstDefined(
  primary: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  return primary || fallback || null;
}

export function captureAttributionFromSearch(
  search: string,
  referrer?: string | null,
  locale?: string | null,
): MarketingAttribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    utmSource: trimCap(params.get("utm_source"), 200),
    utmMedium: trimCap(params.get("utm_medium"), 200),
    utmCampaign: trimCap(params.get("utm_campaign"), 200),
    referrer: trimCap(referrer ?? null, 500),
    locale: locale === "en" ? "en" : locale === "th" ? "th" : null,
  };
}

export function mergeAttribution(
  stored: MarketingAttribution,
  incoming: MarketingAttribution,
): MarketingAttribution {
  return {
    utmSource: firstDefined(incoming.utmSource, stored.utmSource),
    utmMedium: firstDefined(incoming.utmMedium, stored.utmMedium),
    utmCampaign: firstDefined(incoming.utmCampaign, stored.utmCampaign),
    referrer: firstDefined(stored.referrer, incoming.referrer),
    locale: firstDefined(incoming.locale, stored.locale),
  };
}

export function getMarketingAttribution(
  search: string,
  stored: MarketingAttribution = {},
): MarketingAttribution {
  const fromUrl = captureAttributionFromSearch(search);
  return {
    utmSource: firstDefined(fromUrl.utmSource, stored.utmSource),
    utmMedium: firstDefined(fromUrl.utmMedium, stored.utmMedium),
    utmCampaign: firstDefined(fromUrl.utmCampaign, stored.utmCampaign),
    referrer: firstDefined(stored.referrer, fromUrl.referrer),
    locale: firstDefined(fromUrl.locale, stored.locale),
  };
}

export function buildTrialHref(
  search: string,
  stored: MarketingAttribution = {},
): string {
  const data = getMarketingAttribution(search, stored);
  const params = new URLSearchParams();
  if (data.utmSource) params.set("utm_source", data.utmSource);
  if (data.utmMedium) params.set("utm_medium", data.utmMedium);
  if (data.utmCampaign) params.set("utm_campaign", data.utmCampaign);
  const qs = params.toString();
  return qs ? `/trial?${qs}` : "/trial";
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

export function captureMarketingAttribution(
  search: string,
  referrer?: string | null,
  locale?: string | null,
): MarketingAttribution {
  const incoming = captureAttributionFromSearch(search, referrer, locale);
  const merged = mergeAttribution(readStashedAttribution(), incoming);
  stashAttribution(merged);
  return merged;
}
