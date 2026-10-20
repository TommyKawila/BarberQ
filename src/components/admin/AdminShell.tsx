"use client";

import type { ShopStaffRole } from "@/lib/admin-auth";

/**
 * Page content wrapper inside AdminChrome.
 * Nav lives in AdminChrome (layout) so it never unmounts on tab switch.
 * `role` is accepted for call-site compatibility but unused.
 */
export function AdminShell({
  role: _role,
  children,
  thumbBar,
}: {
  role: ShopStaffRole;
  children: React.ReactNode;
  /** Sticky action row. Mobile: full width above nav. ≥1024: right-aligned. */
  thumbBar?: React.ReactNode;
}) {
  void _role;
  return (
    <>
      {children}
      {thumbBar ? (
        <div
          className="fixed inset-x-0 z-30 border-t border-zinc-800 bg-zinc-950 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:mx-auto md:max-w-[640px] lg:static lg:mx-0 lg:mt-4 lg:flex lg:max-w-none lg:justify-end lg:border-0 lg:bg-transparent lg:p-0"
          data-testid="admin-thumb-bar"
        >
          <div className="w-full lg:w-auto lg:min-w-[20rem] lg:max-w-md">{thumbBar}</div>
        </div>
      ) : null}
    </>
  );
}
