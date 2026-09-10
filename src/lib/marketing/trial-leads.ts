export type TrialLeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

export const TRIAL_LEAD_STATUSES: TrialLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "CONVERTED",
  "CLOSED",
];

export interface TrialLead {
  id: string;
  shop_name: string;
  contact_name: string;
  contact_value: string;
  province: string | null;
  barber_count: number | null;
  status: TrialLeadStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  locale: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTrialLeadInput {
  shopName: string;
  contactName: string;
  contactValue: string;
  province?: string | null;
  barberCount?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  locale?: string | null;
}

const FORBIDDEN_FIELD_PATTERN = /password|credential|token|secret/i;
const MAX_TEXT = 200;
const MAX_REFERRER = 500;

function trimCap(value: unknown, max: number): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseBarberCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error("INVALID_BARBER_COUNT");
  }
  return n;
}

function parseLocale(value: unknown): string | null {
  const v = trimCap(value, 8);
  if (!v) return null;
  if (v === "th" || v === "en") return v;
  return null;
}

export function validateTrialLeadPayload(
  body: Record<string, unknown>,
): CreateTrialLeadInput {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) {
      throw new Error("INVALID_CREDENTIAL_FIELD");
    }
  }

  const shopName = trimCap(body.shopName, MAX_TEXT);
  const contactName = trimCap(body.contactName, MAX_TEXT);
  const contactValue = trimCap(body.contactValue, MAX_TEXT);

  if (!shopName) throw new Error("INVALID_SHOP_NAME");
  if (!contactName) throw new Error("INVALID_CONTACT_NAME");
  if (!contactValue) throw new Error("INVALID_CONTACT_VALUE");

  return {
    shopName,
    contactName,
    contactValue,
    province: trimCap(body.province, MAX_TEXT),
    barberCount: parseBarberCount(body.barberCount),
    utmSource: trimCap(body.utmSource, MAX_TEXT),
    utmMedium: trimCap(body.utmMedium, MAX_TEXT),
    utmCampaign: trimCap(body.utmCampaign, MAX_TEXT),
    referrer: trimCap(body.referrer, MAX_REFERRER),
    locale: parseLocale(body.locale),
  };
}

export function isHoneypotTriggered(website: unknown): boolean {
  if (website == null) return false;
  return String(website).trim().length > 0;
}
