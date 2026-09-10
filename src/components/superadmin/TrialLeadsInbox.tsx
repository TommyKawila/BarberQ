"use client";

import { useCallback, useEffect, useState } from "react";
import { TRIAL_LEAD_STATUSES, type TrialLeadStatus } from "@/lib/marketing/trial-leads";

interface TrialLeadRow {
  id: string;
  shop_name: string;
  contact_name: string;
  contact_value: string;
  province: string | null;
  barber_count: number | null;
  status: TrialLeadStatus;
  created_at: string;
}

export function TrialLeadsInbox({ token }: { token: string }) {
  const [rows, setRows] = useState<TrialLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/trial-leads", {
        headers: { "x-superadmin-token": token },
      });
      const json = (await res.json()) as { leads?: TrialLeadRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: TrialLeadStatus) {
    const res = await fetch("/api/superadmin/trial-leads", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-superadmin-token": token,
      },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { lead?: TrialLeadRow };
    if (!json.lead) return;
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: json.lead!.status } : r)),
    );
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading leads…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Shop</th>
            <th className="px-3 py-2 font-medium">Contact</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">Province</th>
            <th className="px-3 py-2 font-medium">Barbers</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-zinc-500">No leads yet</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-800/80">
                <td className="px-3 py-2 font-medium text-zinc-200">{row.shop_name}</td>
                <td className="px-3 py-2">{row.contact_name}</td>
                <td className="px-3 py-2">{row.contact_value}</td>
                <td className="px-3 py-2 text-zinc-400">{row.province ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-400">{row.barber_count ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-400">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      void updateStatus(row.id, e.target.value as TrialLeadStatus)
                    }
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                  >
                    {TRIAL_LEAD_STATUSES.map((s) => (
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
