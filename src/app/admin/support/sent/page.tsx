"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";

function SentInner() {
  const { shopPath } = useShopSlug();
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <section
      className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-10 text-center"
      data-testid="support-sent"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15 text-2xl text-amber-400">
        ✓
      </div>
      <h1 className="font-heading text-xl font-semibold text-zinc-100">ส่งแล้ว</h1>
      <p className="max-w-sm text-sm text-zinc-400">{SUPPORT_REPLY_SLA_COPY_TH}</p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {id ? (
          <Link
            href={shopPath(`/admin/support/reports/${id}`)}
            className="cq-press flex min-h-12 items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
          >
            ดูรายงาน
          </Link>
        ) : null}
        <Link
          href={shopPath("/admin/support/reports")}
          className="cq-press flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 text-sm font-medium text-zinc-100"
        >
          รายงานของฉัน
        </Link>
        <Link
          href={shopPath("/admin")}
          className="cq-press flex min-h-11 items-center justify-center text-sm text-zinc-400"
        >
          กลับวันนี้
        </Link>
      </div>
    </section>
  );
}

export default function SupportSentPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-zinc-500">…</p>}>
      <SentInner />
    </Suspense>
  );
}
