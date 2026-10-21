"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type { SupportTicket, SupportTicketStatus, SupportTicketType } from "@/lib/support/types";

const TYPE_LABEL: Record<SupportTicketType, string> = {
  setup_help: "ขอช่วยตั้งค่า",
  problem: "แจ้งปัญหา",
  feature: "ขอฟีเจอร์",
  crash: "ข้อผิดพลาด",
};

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  new: "ใหม่",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จแล้ว",
  wont_do: "จะไม่ทำ",
};

const STATUS_CLASS: Record<SupportTicketStatus, string> = {
  new: "bg-amber-400/15 text-amber-300",
  in_progress: "bg-sky-400/15 text-sky-300",
  done: "bg-emerald-400/15 text-emerald-300",
  wont_do: "bg-zinc-700/50 text-zinc-400",
};

export function MyReportsList() {
  const { shopApi, shopPath } = useShopSlug();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getLineAuthHeaders();
      const res = await fetch(shopApi("/support/tickets"), { headers });
      const json = (await res.json()) as { tickets?: SupportTicket[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setTickets(json.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [shopApi]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="px-4 py-8 text-sm text-zinc-500">กำลังโหลด…</p>;
  }
  if (error) {
    return <p className="px-4 py-8 text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-6" data-testid="support-my-reports">
      <header>
        <h1 className="font-heading text-xl font-semibold text-zinc-100">รายงานของฉัน</h1>
        <p className="mt-1 text-sm text-zinc-400">ดูสถานะและคำตอบจากทีม ClipperQ</p>
      </header>

      {tickets.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          ยังไม่มีรายงาน
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={shopPath(`/admin/support/reports/${t.id}`)}
                className="cq-press flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-100">
                    {TYPE_LABEL[t.type]}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[t.status]}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-zinc-400">
                  {t.body || "(ไม่มีข้อความ)"}
                </p>
                <p className="text-[11px] text-zinc-600">
                  {new Date(t.created_at).toLocaleString("th-TH")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
