"use client";

import { useCallback, useEffect, useState } from "react";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import type {
  SupportTicket,
  SupportTicketReply,
  SupportTicketStatus,
  SupportTicketType,
} from "@/lib/support/types";

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

export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const { shopApi } = useShopSlug();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getLineAuthHeaders();
      const res = await fetch(shopApi(`/support/tickets/${ticketId}`), { headers });
      const json = (await res.json()) as {
        ticket?: SupportTicket;
        replies?: SupportTicketReply[];
        error?: string;
      };
      if (!res.ok || !json.ticket) throw new Error(json.error ?? "ไม่พบรายงาน");
      setTicket(json.ticket);
      setReplies(json.replies ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [shopApi, ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="px-4 py-8 text-sm text-zinc-500">กำลังโหลด…</p>;
  if (error || !ticket) {
    return <p className="px-4 py-8 text-sm text-red-400">{error ?? "ไม่พบรายงาน"}</p>;
  }

  return (
    <article className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6" data-testid="support-ticket-detail">
      <header className="flex flex-col gap-1">
        <p className="text-xs text-zinc-500">{TYPE_LABEL[ticket.type]}</p>
        <h1 className="font-heading text-xl font-semibold text-zinc-100">
          {STATUS_LABEL[ticket.status]}
        </h1>
        <p className="text-xs text-zinc-600">
          {new Date(ticket.created_at).toLocaleString("th-TH")}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          ข้อความของคุณ
        </h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-200">
          {ticket.body || "(ไม่มีข้อความ)"}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          คำตอบจากทีม
        </h2>
        {replies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-500">
            ยังไม่มีคำตอบ — ทีมจะตอบภายใน 24 ชั่วโมง
          </p>
        ) : (
          replies.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border px-3 py-3 text-sm ${
                r.author_role === "operator"
                  ? "border-amber-500/30 bg-amber-400/5 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-300"
              }`}
            >
              <p className="mb-1 text-[11px] text-zinc-500">
                {r.author_role === "operator" ? "ทีม ClipperQ" : "คุณ"} ·{" "}
                {new Date(r.created_at).toLocaleString("th-TH")}
              </p>
              <p className="whitespace-pre-wrap">{r.body}</p>
            </div>
          ))
        )}
      </section>
    </article>
  );
}
