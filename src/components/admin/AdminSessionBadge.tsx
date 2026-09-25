"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopBrand } from "@/lib/brand/shop-brand";
import type { ShopStaffRole } from "@/lib/admin-auth";

interface AdminSessionBadgeProps {
  name: string;
  role: ShopStaffRole;
}

function roleLabelKey(role: ShopStaffRole) {
  if (role === "owner") return "admin.roleOwner" as const;
  if (role === "manager") return "admin.roleManager" as const;
  return "admin.roleBarber" as const;
}

export function AdminSessionBadge({ name, role }: AdminSessionBadgeProps) {
  const { t } = useI18n();
  const { shopName } = useShopBrand();
  const primary = shopName?.trim() || name;

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-zinc-50">{primary}</span>
        <span
          className={
            role === "owner"
              ? "rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"
              : role === "manager"
                ? "rounded-full border border-violet-400/50 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300"
                : "rounded-full border border-sky-400/50 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-300"
          }
        >
          {t(roleLabelKey(role))}
        </span>
      </div>
      {shopName?.trim() && name && name !== shopName.trim() ? (
        <p className="text-xs text-zinc-500">{name}</p>
      ) : null}
    </div>
  );
}
