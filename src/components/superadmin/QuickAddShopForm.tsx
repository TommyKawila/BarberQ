"use client";

import { useState } from "react";

interface QuickAddShopFormProps {
  token: string;
  onSuccess: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function QuickAddShopForm({ token, onSuccess }: QuickAddShopFormProps) {
  const [shopName, setShopName] = useState("");
  const [ownerLineId, setOwnerLineId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInviteUrl(null);
    setCopied(false);

    try {
      const res = await fetch("/api/superadmin/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({
          shopName,
          ownerLineId: ownerLineId.trim() || undefined,
          ownerName,
          subscriptionMonths: months,
        }),
      });
      const json = (await res.json()) as { error?: string; inviteUrl?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to create shop");

      if (json.inviteUrl) {
        setInviteUrl(json.inviteUrl);
      } else {
        setShopName("");
        setOwnerLineId("");
        setOwnerName("");
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    const ok = await copyText(inviteUrl);
    if (ok) setCopied(true);
  }

  function handleDone() {
    setShopName("");
    setOwnerLineId("");
    setOwnerName("");
    setInviteUrl(null);
    setCopied(false);
    onSuccess();
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
          placeholder="Owner Line ID (optional — leave blank for invite link)"
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
        {inviteUrl ? (
          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">Invite Link</p>
            <p className="break-all text-sm text-zinc-200">{inviteUrl}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-12 rounded-lg bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Shop"}
          </button>
        )}
      </div>
    </form>
  );
}
