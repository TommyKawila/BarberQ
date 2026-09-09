"use client";

import { useState } from "react";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import type { Shop } from "@/types/booking";

interface ShopCardProps {
  shop: Shop & {
    ownerName?: string | null;
    claimed?: boolean;
    setupReady?: boolean;
    hasFirstBooking?: boolean;
    bookableCount?: number;
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-300">{label}</p>
      <p className="break-all text-xs text-zinc-500">{value}</p>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
      >
        {copied ? "Copied!" : "คัดลอก"}
      </button>
    </div>
  );
}

export function ShopCard({ shop }: ShopCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const expires = shop.subscribed_until
    ? new Date(shop.subscribed_until).toLocaleDateString("th-TH")
    : "—";
  const inviteExpires = shop.invite_expires_at
    ? new Date(shop.invite_expires_at).toLocaleDateString("th-TH")
    : null;
  const inviteUrl = shop.invite_token ? buildOwnerInviteUrl(shop.invite_token) : null;
  const webUrl = shop.slug ? buildShopWebUrl(shop.slug) : null;
  const liffUrl = shop.slug ? buildShopLiffUrl(shop.slug) : null;

  async function handleCopy(key: string, value: string) {
    const ok = await copyText(value);
    if (ok) setCopiedKey(key);
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
          <p className="text-xs text-zinc-400">
            Owner: {shop.ownerName ?? "รอ claim"}
          </p>
          <p className="text-xs text-zinc-400">Slug: {shop.slug ?? "—"}</p>
          <p className="text-xs text-zinc-400">Status: {shop.status}</p>
          <p className="text-xs text-zinc-400">Expires: {expires}</p>
          {shop.status !== "pending" ? (
            <p className="text-xs text-zinc-400">
              Setup: {shop.setupReady ? "ready" : "incomplete"}
              {shop.hasFirstBooking ? " · first booking" : ""}
              {shop.bookableCount !== undefined ? ` · ${shop.bookableCount} bookable` : ""}
            </p>
          ) : null}
          {shop.status === "pending" && inviteExpires ? (
            <p className="text-xs text-amber-400">Invite expires: {inviteExpires}</p>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
          {shop.status}
        </span>
      </div>
      {shop.slug ? (
        <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
          {liffUrl ? (
            <CopyRow
              label="ลิงก์จอง (ติดบน OA ร้าน)"
              value={liffUrl}
              copied={copiedKey === "liff"}
              onCopy={() => void handleCopy("liff", liffUrl)}
            />
          ) : null}
          {webUrl ? (
            <CopyRow
              label="ลิงก์เว็บ"
              value={webUrl}
              copied={copiedKey === "web"}
              onCopy={() => void handleCopy("web", webUrl)}
            />
          ) : null}
        </div>
      ) : null}
      {inviteUrl ? (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <CopyRow
            label="Invite Owner"
            value={inviteUrl}
            copied={copiedKey === "invite"}
            onCopy={() => void handleCopy("invite", inviteUrl)}
          />
        </div>
      ) : null}
    </div>
  );
}
