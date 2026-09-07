"use client";

import { useState } from "react";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import type { Shop } from "@/types/booking";

interface ShopCardProps {
  shop: Shop;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShopCard({ shop }: ShopCardProps) {
  const [copied, setCopied] = useState(false);
  const expires = shop.subscribed_until
    ? new Date(shop.subscribed_until).toLocaleDateString("th-TH")
    : "—";
  const inviteExpires = shop.invite_expires_at
    ? new Date(shop.invite_expires_at).toLocaleDateString("th-TH")
    : null;
  const inviteUrl = shop.invite_token ? buildOwnerInviteUrl(shop.invite_token) : null;

  async function handleCopy() {
    if (!inviteUrl) return;
    const ok = await copyText(inviteUrl);
    if (ok) setCopied(true);
  }

  const statusClass =
    shop.status === "active"
      ? "bg-emerald-700/30 text-emerald-300"
      : shop.status === "pending"
        ? "bg-amber-500/20 text-amber-300"
        : "bg-zinc-700 text-zinc-300";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{shop.name}</h3>
          <p className="text-xs text-zinc-400">Status: {shop.status}</p>
          <p className="text-xs text-zinc-400">Expires: {expires}</p>
          {shop.status === "pending" && inviteExpires ? (
            <p className="text-xs text-amber-400">Invite expires: {inviteExpires}</p>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
          {shop.status}
        </span>
      </div>
      {inviteUrl ? (
        <div className="mt-3 space-y-2">
          <p className="break-all text-xs text-zinc-400">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
          >
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
