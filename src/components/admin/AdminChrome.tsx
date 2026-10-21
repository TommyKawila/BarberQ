"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { adminNavRole, useAdminAuth } from "@/lib/admin/admin-auth-context";
import { ADMIN_NAV_OFFSET_CLASS } from "@/lib/admin/admin-nav-items";

function isBareAdminPath(pathname: string): boolean {
  return /\/admin\/(login|setup)(\/|$)/.test(pathname);
}

/**
 * Persistent admin chrome: bottom / side nav stays mounted while page
 * content swaps (including loading.tsx skeletons).
 */
export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const auth = useAdminAuth();

  if (isBareAdminPath(pathname)) {
    return <>{children}</>;
  }

  const role = adminNavRole(auth.profile);

  return (
    <div className="lg:flex lg:min-h-[calc(100vh-3.5rem)] lg:gap-0" data-testid="admin-chrome">
      <AdminNav role={role} />
      <div className="admin-scroll min-w-0 flex-1 lg:pl-0">
        <div
          className={`${ADMIN_NAV_OFFSET_CLASS} w-full lg:mx-auto lg:max-w-7xl lg:px-4 xl:px-6`}
          data-testid="admin-chrome-content"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
