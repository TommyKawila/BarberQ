"use client";

import type { ShopStaffRole } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

export function AdminShell({
  role,
  children,
}: {
  role: ShopStaffRole;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pb-20">{children}</div>
      <AdminNav role={role} />
    </>
  );
}
