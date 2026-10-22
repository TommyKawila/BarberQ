import { getStore } from "@/lib/data";

/** Prefer shop owner LINE id; fall back to ticket reporter. */
export async function resolveOwnerLineUserId(
  shopId: string,
  fallbackLineUserId?: string | null,
): Promise<string | null> {
  const barbers = await getStore().listBarbersByShop(shopId);
  const owner = barbers.find(
    (b) => b.role === "owner" && b.is_active !== false && b.line_id,
  );
  if (owner?.line_id) return owner.line_id;
  const trimmed = fallbackLineUserId?.trim();
  return trimmed || null;
}
