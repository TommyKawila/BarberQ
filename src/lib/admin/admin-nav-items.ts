import type { ShopStaffRole } from "@/lib/admin-auth";

export type AdminNavItemId = "board" | "team" | "schedule" | "stats" | "settings" | "booking";

export function adminNavItems(role: ShopStaffRole): AdminNavItemId[] {
  if (role === "owner") {
    return ["board", "team", "schedule", "stats", "settings", "booking"];
  }
  return ["board", "schedule", "booking"];
}
