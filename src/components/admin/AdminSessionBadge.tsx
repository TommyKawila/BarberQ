"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import type { StaffRole } from "@/lib/data/types";

interface AdminSessionBadgeProps {
  name: string;
  role: StaffRole;
}

export function AdminSessionBadge({ name, role }: AdminSessionBadgeProps) {
  const { t } = useI18n();
  const isSuperAdmin = role === "super_admin";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-base font-semibold text-zinc-50">{name}</span>
      <span
        className={
          isSuperAdmin
            ? "rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"
            : "rounded-full border border-sky-400/50 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-300"
        }
      >
        {isSuperAdmin ? t("admin.roleSuperAdmin") : t("admin.roleBarber")}
      </span>
    </div>
  );
}
