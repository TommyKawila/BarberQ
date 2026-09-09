"use client";

import { useCallback, useEffect, useState } from "react";
import type { LineOaInstallRequestStatus } from "@/lib/onboarding/line-oa-install";
import { LINE_OA_INSTALL_STATUSES } from "@/lib/onboarding/line-oa-install";

interface LineSupportRow {
  id: string;
  shop_id: string;
  shopName: string;
  shopSlug: string | null;
  line_oa: string;
  rich_menu_state: string;
  help_type: string;
  contact_phone: string;
  status: LineOaInstallRequestStatus;
  created_at: string;
}

export function LineSupportInbox({ token }: { token: string }) {
  const [rows, setRows] = useState<LineSupportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/line-support", {
        headers: { "x-superadmin-token": token },
      });
      const json = (await res.json()) as { requests?: LineSupportRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: LineOaInstallRequestStatus) {
    const res = await fetch("/api/superadmin/line-support", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-superadmin-token": token,
      },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { request?: LineSupportRow };
    if (!json.request) return;
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: json.request!.status } : r)),
    );
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading requests…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Shop</th>
            <th className="px-3 py-2 font-medium">Submitted</th>
            <th className="px-3 py-2 font-medium">LINE OA</th>
            <th className="px-3 py-2 font-medium">Rich menu</th>
            <th className="px-3 py-2 font-medium">Help</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-zinc-500">No requests yet</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-800/80">
                <td className="px-3 py-2">
                  <div className="font-medium text-zinc-200">{row.shopName}</div>
                  {row.shopSlug ? (
                    <div className="text-xs text-zinc-500">{row.shopSlug}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-zinc-400">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{row.line_oa}</td>
                <td className="px-3 py-2 text-zinc-400">{row.rich_menu_state}</td>
                <td className="px-3 py-2 text-zinc-400">{row.help_type}</td>
                <td className="px-3 py-2">{row.contact_phone}</td>
                <td className="px-3 py-2">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      void updateStatus(row.id, e.target.value as LineOaInstallRequestStatus)
                    }
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                  >
                    {LINE_OA_INSTALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
