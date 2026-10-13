"use client";

import { useEffect } from "react";

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
  title = "โหลดหน้านี้ไม่สำเร็จ",
  body = "ลองรีโหลดอีกครั้ง — ถ้ายังไม่ได้ แจ้งเจ้าของร้านให้ตรวจการตั้งค่า",
  retryLabel = "ลองใหม่",
}: AdminRouteErrorProps) {
  useEffect(() => {
    console.error("[admin-route-error]", error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
      <p className="max-w-sm text-sm text-zinc-400">{body}</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 min-w-[10rem] rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950"
      >
        {retryLabel}
      </button>
    </section>
  );
}
