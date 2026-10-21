import { createHash } from "crypto";
import { CRASH_NOTIFY_OCCURRENCE_THRESHOLDS } from "@/lib/support/types";

export function buildCrashFingerprint(input: {
  message: string;
  digest?: string | null;
  pagePath?: string | null;
}): string {
  const raw = [
    (input.message || "").trim().slice(0, 500),
    (input.digest || "").trim(),
    (input.pagePath || "").trim(),
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/** True when operator should be notified for this occurrence count. */
export function shouldNotifyCrashOccurrence(count: number): boolean {
  if (count <= 1) return true;
  return (CRASH_NOTIFY_OCCURRENCE_THRESHOLDS as readonly number[]).includes(count);
}
