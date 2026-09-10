const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

interface Entry {
  timestamps: number[];
}

const buckets = new Map<string, Entry>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isTrialRateLimited(ip: string, now = Date.now()): boolean {
  const entry = buckets.get(ip) ?? { timestamps: [] };
  const cutoff = now - WINDOW_MS;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  if (entry.timestamps.length >= MAX_REQUESTS) {
    buckets.set(ip, entry);
    return true;
  }
  entry.timestamps.push(now);
  buckets.set(ip, entry);
  return false;
}

export function resetTrialRateLimit(): void {
  buckets.clear();
}
