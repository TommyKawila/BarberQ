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
  /** Sticky action row. Mobile: full width above nav. ≥1024: right-aligned in content column. */
  thumbBar?: React.ReactNode;
}) {
  return (
    <div className="lg:flex lg:min-h-[calc(100vh-3.5rem)] lg:gap-0">
      <AdminNav role={role} />
      <div className="admin-scroll min-w-0 flex-1 lg:pl-0">
        <div
          className={`${ADMIN_NAV_OFFSET_CLASS} w-full lg:mx-auto lg:max-w-7xl lg:px-4 xl:px-6`}
        >
          {children}
          {thumbBar ? (
            <div className="fixed inset-x-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:mx-auto md:max-w-[640px] lg:static lg:mx-0 lg:mt-4 lg:flex lg:max-w-none lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <div className="w-full lg:w-auto lg:min-w-[20rem] lg:max-w-md">{thumbBar}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
