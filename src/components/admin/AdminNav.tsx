"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShopStaffRole } from "@/lib/admin-auth";
import { adminNavItems, type AdminNavItemId } from "@/lib/admin/admin-nav-items";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

const NAV_LABELS: Record<AdminNavItemId, MessageKey> = {
  board: "admin.nav.board",
  team: "admin.nav.team",
  schedule: "admin.nav.schedule",
  stats: "admin.nav.stats",
  settings: "admin.nav.settings",
  booking: "admin.nav.booking",
};

const NAV_PATHS: Record<AdminNavItemId, string> = {
  board: "/admin",
  team: "/admin/staff",
  schedule: "/admin/my-schedule",
  stats: "/admin/stats",
  settings: "/admin/settings",
  booking: "/",
};

export function AdminNav({ role }: { role: ShopStaffRole }) {
  const { t } = useI18n();
  const { shopPath } = useShopSlug();
  const pathname = usePathname();
  const items = adminNavItems(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur"
      aria-label={t("admin.nav.label")}
    >
      <div className="mx-auto flex max-w-lg overflow-x-auto">
        {items.map((item) => {
          const href = shopPath(NAV_PATHS[item]);
          const active = pathname === href || (item === "board" && pathname.endsWith("/admin"));
          return (
            <Link
              key={item}
              href={href}
              className={`min-w-[4.5rem] flex-1 px-2 py-2.5 text-center text-[10px] font-medium leading-tight ${
                active ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              {t(NAV_LABELS[item])}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
