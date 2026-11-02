import { formatInTimeZone } from "date-fns-tz";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";

/** Minutes late vs appointment start (0 if not yet late). */
export function lateMinutesSinceStart(
  startTime: string,
  now: Date = new Date(),
): number {
  const start = new Date(startTime).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / 60_000));
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

/** Earlier of two ISO instants (ignores invalid). */
function earlierIso(a: string, b: string): string {
  const am = new Date(a).getTime();
  const bm = new Date(b).getTime();
  if (!Number.isFinite(am)) return b;
  if (!Number.isFinite(bm)) return a;
  return am <= bm ? a : b;
}

/**
 * Round-1 free-barber copy:
 * - next booking → "ว่าง N นาที · ถัดไป HH:MM"
 *   N uses min(freeUntil, nextStart) so a break before the next booking is not counted as free.
 * - no next → "รับได้ถึง {freeUntil} (อีกประมาณ X ชม.|นาที)" — time must match freeUntil, not shop close.
 */
export function buildFreeStatusCopy(opts: {
  freeUntilIso: string;
  nextStartIso: string | null | undefined;
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
    const freeSpanEnd = earlierIso(opts.freeUntilIso, nextIso);
    const n = Math.max(1, minutesUntil(freeSpanEnd, now));
    const time = formatHHmm(nextIso);
    return {
      mode: "until_next",
      line: opts.labels.untilNext.replace("{n}", String(n)).replace("{time}", time),
    };
  }

  const untilLabel = formatHHmm(opts.freeUntilIso);
  const remaining = minutesUntil(opts.freeUntilIso, now);
  if (remaining >= 60) {
    const hours = Math.max(1, Math.round(remaining / 60));
    return {
      mode: "until_close",
      line: opts.labels.untilCloseHours
        .replace("{time}", untilLabel)
        .replace("{n}", String(hours)),
    };
  }
  return {
    mode: "until_close",
    line: opts.labels.untilCloseMinutes
      .replace("{time}", untilLabel)
      .replace("{n}", String(Math.max(1, remaining || 1))),
  };
}
