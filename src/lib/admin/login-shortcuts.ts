import { STAFF_SEED } from "@/lib/data/staff-seed";

export const STAFF_LOGIN_SHORTCUTS: Record<string, string> = {
  saeb: STAFF_SEED[0].token,
  tide: STAFF_SEED[1].token,
  nat: STAFF_SEED[2].token,
};

export const STAFF_LOGIN_SHORTCUT_SLUGS = Object.keys(STAFF_LOGIN_SHORTCUTS);

export function isStaffLoginShortcut(slug: string): boolean {
  return slug in STAFF_LOGIN_SHORTCUTS;
}
