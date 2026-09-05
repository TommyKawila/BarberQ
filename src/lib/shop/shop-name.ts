const MIN_SHOP_NAME_LEN = 1;
const MAX_SHOP_NAME_LEN = 40;

export function normalizeShopName(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidShopName(value: string | null): boolean {
  if (value === null) return true;
  return value.length >= MIN_SHOP_NAME_LEN && value.length <= MAX_SHOP_NAME_LEN;
}
