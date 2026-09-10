import type { ShopStaffRole } from "@/lib/admin-auth";

export type AdminNavItemId =
  | "board"
  | "team"
  | "schedule"
  | "stats"
  | "settings"
  | "booking"
  | "more";

export type AdminNavDestinationId = Exclude<AdminNavItemId, "more">;

export const ADMIN_NAV_PATHS: Record<AdminNavDestinationId, string> = {
  board: "/admin",
  team: "/admin/staff",
  schedule: "/admin/my-schedule",
  stats: "/admin/stats",
  settings: "/admin/settings",
  booking: "/",
};

export const ADMIN_NAV_OFFSET_CLASS =
  "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]";
export const ADMIN_NAV_STICKY_BOTTOM_CLASS =
  "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]";
export const ADMIN_NAV_BAR_PADDING_CLASS =
  "pb-[env(safe-area-inset-bottom,0px)]";

export function primaryAdminNavItems(role: ShopStaffRole): AdminNavItemId[] {
  if (role === "owner") return ["board", "team", "stats", "more"];
  return ["board", "schedule", "more"];
}

export function moreAdminNavItems(role: ShopStaffRole): AdminNavDestinationId[] {
  if (role === "owner") return ["schedule", "settings", "booking"];
  return ["booking"];
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
