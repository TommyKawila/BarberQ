import type { ShopStaffRole } from "@/lib/admin-auth";

export type AdminNavItemId =
  | "board"
  | "team"
  | "schedule"
  | "stats"
  | "settings"
  | "notifications"
  | "billing"
  | "booking"
  | "more";

export type AdminNavDestinationId = Exclude<AdminNavItemId, "more">;

export const ADMIN_NAV_PATHS: Record<AdminNavDestinationId, string> = {
  board: "/admin",
  team: "/admin/staff",
  schedule: "/admin/my-schedule",
  stats: "/admin/stats",
  settings: "/admin/settings",
  notifications: "/admin/settings/notifications",
  billing: "/admin/billing",
  booking: "/",
};

/** Content bottom padding so sticky thumb bar + bottom nav (~154px) don't cover content (AD-16). */
export const ADMIN_NAV_OFFSET_CLASS =
  "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6";
export const ADMIN_NAV_STICKY_BOTTOM_CLASS =
  "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-4";
/** Extra offset when a sticky action bar sits above the bottom nav (AD-16 / AD-19). */
export const ADMIN_THUMB_BAR_OFFSET_CLASS =
  "pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] lg:pb-24";
export const ADMIN_NAV_BAR_PADDING_CLASS =
  "pb-[env(safe-area-inset-bottom,0px)]";

/**
 * Sticky save / discard bar (barber edit, etc.).
 * Mobile: sits above the bottom nav. lg+: clear of the `w-56` sidebar (`lg:left-56`),
 * opaque zinc-950 + top border so form content never shows through; safe-area padding.
 */
export const ADMIN_STICKY_SAVE_BAR_CLASS = [
  "fixed inset-x-0 z-30",
  "border-t border-zinc-800 bg-zinc-950",
  "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
  "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
  // iPad landscape / desktop: sidebar is visible — do not start at x=0.
  "lg:left-56 lg:bottom-0",
].join(" ");

export function primaryAdminNavItems(role: ShopStaffRole): AdminNavItemId[] {
  if (role === "owner" || role === "manager") return ["board", "team", "stats", "more"];
  // D5: barbers see personal summary ("สรุปของฉัน")
  return ["board", "stats", "more"];
}

export function moreAdminNavItems(role: ShopStaffRole): AdminNavDestinationId[] {
  if (role === "owner") {
    return ["schedule", "settings", "billing", "notifications", "booking"];
  }
  if (role === "manager") {
    return ["schedule", "settings", "notifications", "booking"];
  }
  return ["schedule", "notifications", "booking"];
}

export function adminNavItems(role: ShopStaffRole): AdminNavItemId[] {
  return [...primaryAdminNavItems(role).filter((id) => id !== "more"), ...moreAdminNavItems(role)];
}

export function isBoardPath(pathname: string, boardHref: string): boolean {
  return pathname === boardHref || pathname.endsWith("/admin");
}

export function isTeamPath(pathname: string, teamHref: string): boolean {
  return pathname === teamHref || pathname.startsWith(`${teamHref}/`);
}

export function isMoreDestinationPath(
  pathname: string,
  dest: AdminNavDestinationId,
  hrefs: Record<AdminNavDestinationId, string>,
): boolean {
  if (dest === "booking") return pathname === hrefs.booking;
  if (dest === "team") return isTeamPath(pathname, hrefs.team);
  return pathname === hrefs[dest];
}

export function isPrimaryNavActive(
  item: AdminNavItemId,
  pathname: string,
  hrefs: Record<AdminNavDestinationId, string>,
  moreOpen: boolean,
  moreDestinations: AdminNavDestinationId[],
): boolean {
  if (item === "more") {
    if (moreOpen) return true;
    return moreDestinations.some((dest) => isMoreDestinationPath(pathname, dest, hrefs));
  }
  if (item === "board") return isBoardPath(pathname, hrefs.board);
  if (item === "team") return isTeamPath(pathname, hrefs.team);
  return pathname === hrefs[item as AdminNavDestinationId];
}
