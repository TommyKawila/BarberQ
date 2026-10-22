"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { collectSupportDeviceMeta } from "@/lib/support/device-meta";
import { MAX_SUPPORT_SCREENSHOTS } from "@/lib/support/screenshot-storage";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";
import type { SupportTicketType } from "@/lib/support/types";

export function TicketForm({
  type,
  title,
  placeholder,
  submitLabel,
}: {
  type: Exclude<SupportTicketType, "crash">;
  title: string;
  placeholder: string;
  submitLabel: string;
}) {
  const { shopApi, shopPath } = useShopSlug();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 3) {
      setError("กรุณาเขียนรายละเอียดอย่างน้อยสั้นๆ");
      return;
    }
    setSending(true);
    try {
      const headers = await getLineAuthHeaders();
      const paths: string[] = [];
      for (const file of files.slice(0, MAX_SUPPORT_SCREENSHOTS)) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(shopApi("/support/screenshots"), {
          method: "POST",
          headers,
          body: fd,
        });
        const upJson = (await up.json()) as { path?: string; error?: string };
        if (!up.ok || !upJson.path) {
          throw new Error(upJson.error ?? "อัปโหลดรูปไม่สำเร็จ");
        }
        paths.push(upJson.path);
      }

      const meta = collectSupportDeviceMeta(pathname);
      const res = await fetch(shopApi("/support/tickets"), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          body: body.trim(),
          pagePath: meta.pagePath,
          deviceInfo: meta.deviceInfo,
          appVersion: meta.appVersion,
          screenshotPaths: paths,
        }),
      });
      const json = (await res.json()) as { ticket?: { id: string }; error?: string };
      if (!res.ok || !json.ticket) {
        throw new Error(json.error ?? "ส่งไม่สำเร็จ");
      }
      router.replace(
        shopPath(`/admin/support/sent?id=${encodeURIComponent(json.ticket.id)}`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6"
      data-testid={`support-form-${type}`}
    >
      <header>
        <h1 className="font-heading text-xl font-semibold text-zinc-100">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{SUPPORT_REPLY_SLA_COPY_TH}</p>
      </header>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-zinc-300">รายละเอียด</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder={placeholder}
          className="min-h-32 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          required
        />
      </label>

      {type === "problem" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm text-zinc-300">
            รูปหน้าจอ (ไม่เกิน {MAX_SUPPORT_SCREENSHOTS} รูป)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []).slice(
                0,
                MAX_SUPPORT_SCREENSHOTS,
              );
              setFiles(list);
            }}
            className="text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-100"
          />
          {files.length > 0 ? (
            <span className="text-xs text-zinc-500">เลือกแล้ว {files.length} รูป</span>
          ) : null}
        </label>
      ) : null}

      {/* Hidden auto-attach context — values collected on submit */}
      <input type="hidden" name="pagePath" value={pathname} readOnly />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={sending}
        className="cq-press min-h-12 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {sending ? "กำลังส่ง…" : submitLabel}
      </button>
    </form>
  );
}
