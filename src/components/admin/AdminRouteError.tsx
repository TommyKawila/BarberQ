"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { collectSupportDeviceMeta } from "@/lib/support/device-meta";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";

interface AdminRouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  body?: string;
  retryLabel?: string;
}

export function AdminRouteError({
  error,
  reset,
  title = "มีอะไรผิดพลาดเล็กน้อย",
  body = "ไม่ต้องห่วง — กดลองใหม่ได้ หรือแจ้งทีม ClipperQ ให้ช่วยดู",
  retryLabel = "ลองใหม่",
}: AdminRouteErrorProps) {
  const { shopApi, shopPath } = useShopSlug();
  const reported = useRef(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  useEffect(() => {
    console.error("[admin-route-error]", error);
  }, [error]);

  // Auto-report crash (deduped server-side)
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    const meta = collectSupportDeviceMeta(
      typeof window !== "undefined" ? window.location.pathname : undefined,
    );
    void (async () => {
      try {
        const headers = await getLineAuthHeaders();
        await fetch(shopApi("/support/crash"), {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message || "Admin route error",
            digest: error.digest ?? null,
            pagePath: meta.pagePath,
            deviceInfo: meta.deviceInfo,
            appVersion: meta.appVersion,
          }),
        });
      } catch {
        // Best-effort auto report
      }
    })();
  }, [error, shopApi]);

  async function reportManually() {
    setReportState("sending");
    try {
      const headers = await getLineAuthHeaders();
      const meta = collectSupportDeviceMeta(
        typeof window !== "undefined" ? window.location.pathname : undefined,
      );
      const res = await fetch(shopApi("/support/tickets"), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "problem",
          body: `แจ้งจากหน้า error: ${error.message || "unknown"}`,
          pagePath: meta.pagePath,
          deviceInfo: meta.deviceInfo,
          errorMessage: error.message,
          errorDigest: error.digest ?? null,
          appVersion: meta.appVersion,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setReportState("sent");
    } catch {
      setReportState("error");
    }
  }

  return (
    <section
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center"
      data-testid="support-friendly-error"
    >
      <h1 className="font-heading text-lg font-semibold text-zinc-100">{title}</h1>
      <p className="max-w-sm text-sm text-zinc-400">{body}</p>
      <p className="max-w-sm text-xs text-zinc-600">{SUPPORT_REPLY_SLA_COPY_TH}</p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="cq-press min-h-11 w-full rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950"
        >
          {retryLabel}
        </button>
        <button
          type="button"
          disabled={reportState === "sending" || reportState === "sent"}
          onClick={() => void reportManually()}
          className="cq-press min-h-11 w-full rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-100 disabled:opacity-60"
        >
          {reportState === "sent"
            ? "ส่งให้ทีมแล้ว"
            : reportState === "sending"
              ? "กำลังส่ง…"
              : "แจ้งทีมช่วยดู"}
        </button>
        <Link
          href={shopPath("/admin/support/reports")}
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          รายงานของฉัน
        </Link>
      </div>
      {reportState === "error" ? (
        <p className="text-xs text-red-400">ส่งไม่สำเร็จ — ลองอีกครั้งหรือแชท LINE</p>
      ) : null}
    </section>
  );
}
