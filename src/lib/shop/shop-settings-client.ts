import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";

/**
 * Public shop settings as returned by GET /api/[shop]/settings.
 * logoDataUrl alone is often ~100KB — never re-download on every navigation.
 */
export type PublicShopSettings = {
  logoDataUrl?: string | null;
  coverImageUrl?: string | null;
  shopName?: string | null;
  lineUrl?: string | null;
  phone?: string | null;
  hours?: ShopHours | null;
  remindersEnabled?: boolean;
  reminderLeadMinutes?: number;
  bookingConfirmPushEnabled?: boolean;
  queueAheadPushEnabled?: boolean;
  showFlexBrandFooter?: boolean;
  bookingAdvanceDays?: number;
  /** Per-shop LINE add-friend URL (from OA basicId), else platform demo fallback. */
  lineAddFriendUrl?: string | null;
};

type CacheEntry = {
  data: PublicShopSettings;
  fetchedAt: number;
  promise?: Promise<PublicShopSettings>;
};

/** Short TTL: enough to cover booking → My Bookings / slot-select remounts. */
export const SHOP_SETTINGS_CACHE_TTL_MS = 60_000;

const cache = new Map<string, CacheEntry>();

function cacheKey(shopSlug: string): string {
  return shopSlug.trim().toLowerCase();
}

/**
 * Dedupes in-flight GETs and reuses a fresh response for TTL ms.
 * Force bypasses TTL but still joins an in-flight request for the same slug.
 */
export async function fetchShopSettingsCached(
  shopSlug: string,
  opts?: { force?: boolean },
): Promise<PublicShopSettings> {
  const key = cacheKey(shopSlug);
  const now = Date.now();
  const existing = cache.get(key);

  if (!opts?.force && existing && now - existing.fetchedAt < SHOP_SETTINGS_CACHE_TTL_MS) {
    return existing.data;
  }
  if (existing?.promise) {
    return existing.promise;
  }

  const promise = (async () => {
    const res = await fetch(`/api/${shopSlug}/settings`, { cache: "no-store" });
    if (!res.ok) throw new Error(`settings_${res.status}`);
    const data = (await res.json()) as PublicShopSettings;
    cache.set(key, { data, fetchedAt: Date.now() });
    return data;
  })();

  cache.set(key, {
    data: existing?.data ?? {},
    fetchedAt: existing?.fetchedAt ?? 0,
    promise,
  });

  try {
    return await promise;
  } catch (err) {
    const cur = cache.get(key);
    if (cur?.promise === promise) {
      if (cur.fetchedAt > 0 && Object.keys(cur.data).length > 0) {
        cache.set(key, { data: cur.data, fetchedAt: cur.fetchedAt });
      } else {
        cache.delete(key);
      }
    }
    throw err;
  }
}

export function readShopSettingsCache(shopSlug: string): PublicShopSettings | null {
  const entry = cache.get(cacheKey(shopSlug));
  if (!entry || Date.now() - entry.fetchedAt >= SHOP_SETTINGS_CACHE_TTL_MS) {
    return null;
  }
  return entry.data;
}

export function shopHoursFromSettings(settings: PublicShopSettings | null | undefined): ShopHours {
  return normalizeShopHours(settings?.hours ?? null);
}

/** @internal tests */
export function __resetShopSettingsCacheForTests() {
  cache.clear();
}
