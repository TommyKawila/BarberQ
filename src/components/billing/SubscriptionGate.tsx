"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { PlanSnapshot } from "@/lib/billing/plan-state";

function isBillingOrSetupPath(pathname: string): boolean {
  return /\/admin\/(billing|setup|login)(\/|$)/.test(pathname);
}

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const shopSlug = useShopSlug();
  const auth = useAdminAuth();
  const [plan, setPlan] = useState<PlanSnapshot | null>(null);

  useEffect(() => {
    if (!auth.ready) return;
    if (!auth.profile || auth.profile.role !== "owner") {
      setPlan(null);
      return;
    }
    if (isBillingOrSetupPath(pathname)) {
      setPlan(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/${shopSlug}/billing`, {
          headers: getLineAuthHeaders(auth.profile?.lineId),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { plan?: PlanSnapshot };
        if (!cancelled) setPlan(json.plan ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.ready, auth.profile, pathname, shopSlug]);

  if (isBillingOrSetupPath(pathname)) return <>{children}</>;

  if (plan?.state === "expired") {
    return (
      <section
        data-testid="subscription-expired"
        className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-4 px-4 py-10 text-center"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
          ClipperQ
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">แพ็กเกจหมดอายุแล้ว</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          ข้อมูลร้านยังอยู่ครบ — ลูกค้าจองใหม่ไม่ได้ชั่วคราว
          กรุณาต่ออายุเพื่อเปิดใช้งานอีกครั้ง
        </p>
        <Link
          href={`/${shopSlug}/admin/billing`}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-5 font-semibold text-zinc-950"
        >
          ไปหน้าชำระเงิน / ต่ออายุ
        </Link>
      </section>
    );
  }

  if (plan?.state === "grace" && auth.profile?.role === "owner") {
    return (
      <>
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          แพ็กเกจหมดอายุแล้ว — ผ่อนผันได้อีกไม่กี่วัน{" "}
          <Link href={`/${shopSlug}/admin/billing`} className="underline">
            ต่ออายุ
          </Link>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
