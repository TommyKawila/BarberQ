const OPEN_TARGETS: Record<string, string> = {
  guide: "/guide",
  home: "/",
  admin: "/admin",
  saeb: "/saeb",
  tide: "/tide",
  nat: "/nat",
  schedule: "/admin/my-schedule",
};

export function resolveOpenTarget(to: string | null | undefined): string {
  const raw = (to ?? "guide").trim().toLowerCase();
  if (!raw) return OPEN_TARGETS.guide;
  if (OPEN_TARGETS[raw]) return OPEN_TARGETS[raw];
  if (raw.startsWith("/") && isAllowedPath(raw)) return raw;
  return OPEN_TARGETS.guide;
}

function isAllowedPath(path: string): boolean {
  const allowed = new Set(Object.values(OPEN_TARGETS));
  return allowed.has(path);
}

export function buildAbsoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}
