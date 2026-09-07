const PHONE_RE = /^0\d{8,9}$/;

export function normalizeShopPhone(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidShopPhone(value: string | null): boolean {
  if (value === null) return true;
  return PHONE_RE.test(value);
}

export function normalizeShopLineUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidShopLineUrl(value: string | null): boolean {
  if (value === null) return true;
  return value.startsWith("https://") && value.length <= 200;
}
