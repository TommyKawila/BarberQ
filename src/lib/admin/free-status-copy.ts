import { formatInTimeZone } from "date-fns-tz";
import {
  dateISOFromInstant,
  resolveShopHoursForDate,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";

/** Minutes late vs appointment start (0 if not yet late). */
export function lateMinutesSinceStart(
  startTime: string,
  now: Date = new Date(),
): number {
  const start = new Date(startTime).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / 60_000));
}

/** Shop close HH:mm for the Bangkok calendar day of `now`, or null if closed all day. */
export function shopCloseHHmmForNow(
  hours: ShopHours | null | undefined,
  now: Date = new Date(),
): string | null {
  const dateISO = dateISOFromInstant(now);
  const day = resolveShopHoursForDate(hours, dateISO);
  return day?.close ?? null;
}

export type FreeStatusMode = "until_next" | "until_close";

export interface FreeStatusCopy {
  mode: FreeStatusMode;
  /** Single display line — never dumps raw huge minute counts without a next booking. */
  line: string;
}

function minutesUntil(iso: string, now: Date): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((t - now.getTime()) / 60_000));
}

function formatHHmm(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "HH:mm");
}

/**
 * Round-1 free-barber copy:
 * - next booking → "ว่าง N นาที · ถัดไป HH:MM"
 * - no next → "รับได้ถึง HH:MM (อีกประมาณ X ชม.|นาที)" — never "659 นาที" alone
 */
export function buildFreeStatusCopy(opts: {
  freeUntilIso: string;
  nextStartIso: string | null | undefined;
  shopCloseHHmm: string | null | undefined;
  now?: Date;
  labels: {
    /** "ว่าง {n} นาที · ถัดไป {time}" */
    untilNext: string;
    /** "รับได้ถึง {time} (อีกประมาณ {n} ชม.)" */
    untilCloseHours: string;
    /** "รับได้ถึง {time} (อีกประมาณ {n} นาที)" */
    untilCloseMinutes: string;
  };
}): FreeStatusCopy {
  const now = opts.now ?? new Date();
  const nextIso = opts.nextStartIso?.trim() || null;

  if (nextIso) {
    const n = Math.max(1, minutesUntil(nextIso, now));
    const time = formatHHmm(nextIso);
    return {
      mode: "until_next",
      line: opts.labels.untilNext.replace("{n}", String(n)).replace("{time}", time),
    };
  }

  const closeLabel =
    (opts.shopCloseHHmm?.trim() || null) ?? formatHHmm(opts.freeUntilIso);
  const remaining = minutesUntil(opts.freeUntilIso, now);
  if (remaining >= 60) {
    const hours = Math.max(1, Math.round(remaining / 60));
    return {
      mode: "until_close",
      line: opts.labels.untilCloseHours
        .replace("{time}", closeLabel)
        .replace("{n}", String(hours)),
    };
  }
  return {
    mode: "until_close",
    line: opts.labels.untilCloseMinutes
      .replace("{time}", closeLabel)
      .replace("{n}", String(Math.max(1, remaining || 1))),
  };
}
