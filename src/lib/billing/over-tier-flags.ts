import type { Appointment, Barber, Shop } from "@/types/booking";
import type { ShopHours } from "@/lib/shop/shop-hours";
import {
  countBookableBarberSeats,
  isOverTier,
  normalizeBarberTier,
  type BarberTierId,
} from "@/lib/billing/barber-tier";

/** Suspicious barber display names used as shared/shift seats. */
const SUSPICIOUS_NAME =
  /กะ|shift|ช่าง\s*\d|ช่าง\d+|ทั่วไป|รวม|barber\s*\d/i;

export type ShopSeatFlag =
  | { code: "over_tier"; label: string }
  | { code: "suspicious_name"; label: string; barberId: string; barberName: string }
  | { code: "dense_day"; label: string; barberId: string; barberName: string; date: string };

export function isSuspiciousBarberName(name: string): boolean {
  return SUSPICIOUS_NAME.test(name.trim());
}

function openingMinutesForDate(
  hours: ShopHours | null | undefined,
  dateISO: string,
): number | null {
  if (!hours || hours.length !== 7) return null;
  const day = new Date(`${dateISO}T12:00:00+07:00`).getDay(); // 0 Sun
  const row = hours[day];
  if (!row || row.closed) return 0;
  const [sh, sm] = row.open.split(":").map(Number);
  const [eh, em] = row.close.split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return null;
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Read-only hints for Tommy (superadmin). Never auto-punish.
 * - over_tier badge context
 * - names like กะ / shift / ช่าง1
 * - bookings/day that exceed shop opening window ÷ slot
 */
export function collectShopSeatFlags(input: {
  shop: Shop;
  barbers: Barber[];
  appointments?: Appointment[];
  hours?: ShopHours | null;
}): ShopSeatFlag[] {
  const flags: ShopSeatFlag[] = [];
  const tier = normalizeBarberTier(input.shop.barber_tier);
  const bookable = countBookableBarberSeats(input.barbers);
  if (isOverTier(bookable, tier)) {
    flags.push({
      code: "over_tier",
      label: `เกิน tier (${bookable} bookable · ${tier})`,
    });
  }

  for (const b of input.barbers) {
    if (b.is_active === false) continue;
    if (isSuspiciousBarberName(b.name)) {
      flags.push({
        code: "suspicious_name",
        label: `ชื่อน่าสงสัย: ${b.name}`,
        barberId: b.id,
        barberName: b.name,
      });
    }
  }

  const appts = input.appointments ?? [];
  if (appts.length > 0 && input.hours) {
    const byBarberDay = new Map<string, number>();
    for (const a of appts) {
      if (a.status === "cancelled") continue;
      const date = a.start_time.slice(0, 10);
      const key = `${a.barber_id}|${date}`;
      byBarberDay.set(key, (byBarberDay.get(key) ?? 0) + 1);
    }
    for (const [key, count] of byBarberDay) {
      const [barberId, date] = key.split("|");
      const barber = input.barbers.find((b) => b.id === barberId);
      if (!barber) continue;
      const openMin = openingMinutesForDate(input.hours, date);
      if (openMin == null || openMin <= 0) continue;
      const slot = barber.slot_duration_minutes || 30;
      const capacity = Math.floor(openMin / slot);
      if (count > capacity) {
        flags.push({
          code: "dense_day",
          label: `${barber.name}: ${count} คิวในวัน ${date} (เปิดรับได้ ~${capacity})`,
          barberId: barber.id,
          barberName: barber.name,
          date,
        });
      }
    }
  }

  return flags;
}

export function shopTierSummary(shop: Shop, barbers: Barber[]): {
  tier: BarberTierId;
  bookableCount: number;
  overTier: boolean;
} {
  const tier = normalizeBarberTier(shop.barber_tier);
  const bookableCount = countBookableBarberSeats(barbers);
  return {
    tier,
    bookableCount,
    overTier: isOverTier(bookableCount, tier),
  };
}
