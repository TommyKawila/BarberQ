"use client";

import type { ShopStaffRole } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_NAV_OFFSET_CLASS } from "@/lib/admin/admin-nav-items";

export function AdminShell({
  role,
  children,
  thumbBar,
}: {
  role: ShopStaffRole;
  children: React.ReactNode;
  /** Optional sticky action row (e.g. Block + Walk-in). On lg moves beside content (AD-19). */
  thumbBar?: React.ReactNode;
}) {
  return (
    <div className="lg:flex lg:min-h-[calc(100vh-3.5rem)] lg:gap-0">
      <AdminNav role={role} />
      <div className="admin-scroll min-w-0 flex-1 lg:pl-0">
        <div className={`${ADMIN_NAV_OFFSET_CLASS} lg:max-w-5xl lg:px-2`}>
          {children}
          {thumbBar ? (
            <div className="fixed inset-x-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:mx-auto md:max-w-[640px] lg:static lg:mx-0 lg:mt-4 lg:max-w-none lg:border lg:border-zinc-800 lg:rounded-2xl lg:bg-zinc-900">
              {thumbBar}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
