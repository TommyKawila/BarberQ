"use client";

import { useState } from "react";

interface QuickAddShopFormProps {
  token: string;
  onSuccess: () => void;
}

export function QuickAddShopForm({ token, onSuccess }: QuickAddShopFormProps) {
  const [shopName, setShopName] = useState("");
  const [ownerLineId, setOwnerLineId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/superadmin/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({
          shopName,
          ownerLineId,
          ownerName,
          subscriptionMonths: months,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to create shop");

      setShopName("");
      setOwnerLineId("");
      setOwnerName("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold">Quick Add Shop</h3>
      <div className="space-y-3">
        <input
          required
          placeholder="Shop Name (e.g. PHINX STUDIO)"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 outline-none"
        />
        <input
          required
          placeholder="Owner Line ID"
          value={ownerLineId}
          onChange={(e) => setOwnerLineId(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 outline-none"
        />
        <input
          placeholder="Owner Name (optional)"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 outline-none"
        />
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 outline-none"
        >
          <option value={1}>1 month</option>
          <option value={3}>3 months</option>
          <option value={12}>12 months</option>
        </select>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-12 rounded-lg bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Shop"}
        </button>
      </div>
    </form>
  );
}
