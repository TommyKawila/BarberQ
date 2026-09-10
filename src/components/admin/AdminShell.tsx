"use client";

import type { ShopStaffRole } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_NAV_OFFSET_CLASS } from "@/lib/admin/admin-nav-items";

export function AdminShell({
  role,
  children,
}: {
  role: ShopStaffRole;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={ADMIN_NAV_OFFSET_CLASS}>{children}</div>
      <AdminNav role={role} />
    </>
  );
}
