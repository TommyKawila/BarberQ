"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_TYPES,
  type SupportTicketStatus,
  type SupportTicketType,
  type SupportTicketReply,
} from "@/lib/support/types";

interface SupportRow {
  id: string;
  shop_id: string;
  shopName: string;
  shopSlug: string | null;
  type: SupportTicketType;
  status: SupportTicketStatus;
  body: string;
  occurrence_count: number;
  created_at: string;
  reporter_name: string | null;
}

const TYPE_LABEL: Record<SupportTicketType, string> = {
  setup_help: "Setup",
  problem: "Problem",
  feature: "Feature",
  crash: "Crash",
};

export function SupportInbox({ token }: { token: string }) {
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<SupportRow | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (typeFilter) qs.set("type", typeFilter);
      if (statusFilter) qs.set("status", statusFilter);
      const res = await fetch(`/api/superadmin/support?${qs.toString()}`, {
        headers: { "x-superadmin-token": token },
      });
      const json = (await res.json()) as {
        tickets?: SupportRow[];
        error?: string | { message?: string; code?: string };
      };
      if (!res.ok) {
        const errMsg =
          typeof json.error === "string"
            ? json.error
            : json.error?.message || json.error?.code || "Failed to load";
        throw new Error(errMsg);
      }
      setRows(json.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, typeFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(row: SupportRow) {
    setSelected(row);
    setReplyText("");
    const res = await fetch(`/api/superadmin/support/${row.id}`, {
      headers: { "x-superadmin-token": token },
    });
    const json = (await res.json()) as {
      ticket?: SupportRow;
      replies?: SupportTicketReply[];
    };
    if (json.ticket) setSelected({ ...row, ...json.ticket });
    setReplies(json.replies ?? []);
  }

  async function patch(payload: { status?: SupportTicketStatus; reply?: string }) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/support", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({ id: selected.id, ...payload }),
      });
      const json = (await res.json()) as {
        ticket?: SupportRow;
        replies?: SupportTicketReply[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      if (json.ticket) {
        setSelected(json.ticket);
        setRows((prev) =>
          prev.map((r) => (r.id === json.ticket!.id ? { ...r, ...json.ticket! } : r)),
        );
      }
      if (json.replies) setReplies(json.replies);
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="superadmin-support-inbox">
      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {SUPPORT_TICKET_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {SUPPORT_TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Shop</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Preview</th>
              <th className="px-3 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-zinc-500">
                  No tickets yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-zinc-800/80 hover:bg-zinc-900/50"
                  onClick={() => void openDetail(row)}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-zinc-200">{row.shopName}</div>
                    {row.shopSlug ? (
                      <div className="text-xs text-zinc-500">{row.shopSlug}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">
                    {TYPE_LABEL[row.type]}
                    {row.type === "crash" && row.occurrence_count > 1
                      ? ` ×${row.occurrence_count}`
                      : ""}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{row.status}</td>
                  <td className="max-w-[16rem] truncate px-3 py-2 text-zinc-400">
                    {row.body}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {TYPE_LABEL[selected.type]} · {selected.shopName}
              </h3>
              <p className="text-xs text-zinc-500">
                {selected.reporter_name ?? "—"} · {selected.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          <p className="mb-3 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-200">
            {selected.body}
          </p>

          <label className="mb-3 flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Status</span>
            <select
              value={selected.status}
              disabled={saving}
              onChange={(e) =>
                void patch({ status: e.target.value as SupportTicketStatus })
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            >
              {SUPPORT_TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="mb-3 flex flex-col gap-2">
            <h4 className="text-sm font-medium text-zinc-300">Replies</h4>
            {replies.length === 0 ? (
              <p className="text-xs text-zinc-500">No replies yet</p>
            ) : (
              replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
                >
                  <p className="text-[11px] text-zinc-500">
                    {r.author_role} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                </div>
              ))
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-400">Reply (shown in app + LINE to owner)</span>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Reply within 24 hours…"
            />
            <button
              type="button"
              disabled={saving || !replyText.trim()}
              onClick={() => void patch({ reply: replyText.trim() })}
              className="min-h-11 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {saving ? "Sending…" : "Send reply"}
            </button>
          </label>
        </div>
      ) : null}
    </div>
  );
}
