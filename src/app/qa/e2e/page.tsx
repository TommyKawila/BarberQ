"use client";

import { useEffect, useState } from "react";
import { writeQaE2eClientSession } from "@/lib/qa-e2e/client-session";

/**
 * QA-only bootstrap page for Playwright.
 * Exchanges ?secret=… for a client bearer stored in sessionStorage, then redirects.
 * Server returns 404 when QA E2E is disabled — this page still mounts but cannot auth.
 */
export default function QaE2eLoginPage() {
  const [message, setMessage] = useState("กำลังเตรียม QA session…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secret = params.get("secret");
    const redirect = params.get("redirect") || "/barberqpilottest/admin";

    if (!secret) {
      setMessage("ขาด secret — ใช้ได้เฉพาะบน barberq-qa เมื่อตั้ง QA_E2E_SECRET");
      return;
    }

    void (async () => {
      const res = await fetch("/api/qa/e2e-session", {
        method: "POST",
        headers: { "x-qa-e2e-secret": secret },
      });
      if (!res.ok) {
        setMessage(`QA E2E ปิดอยู่หรือ secret ไม่ถูก (${res.status})`);
        return;
      }
      const data = (await res.json()) as {
        token?: string;
        lineUserId?: string;
        shopSlug?: string;
        role?: "owner" | "barber" | "manager";
      };
      if (!data.token || !data.lineUserId || !data.shopSlug || !data.role) {
        setMessage("ไม่ได้รับ token");
        return;
      }
      writeQaE2eClientSession({
        token: data.token,
        lineUserId: data.lineUserId,
        shopSlug: data.shopSlug,
        role: data.role,
      });
      window.location.replace(redirect);
    })();
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-6 text-zinc-200">
      <h1 className="text-lg font-semibold text-amber-300">ClipperQ QA E2E</h1>
      <p className="text-sm text-zinc-400">{message}</p>
      <p className="text-xs text-zinc-600">
        หน้านี้เปิดได้เฉพาะเมื่อ BARBERQ_ENV=founder_qa และโปรเจกต์คือ barberq-qa
      </p>
    </main>
  );
}
