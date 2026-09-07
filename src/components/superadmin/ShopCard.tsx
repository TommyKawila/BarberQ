"use client";

import type { Shop } from "@/types/booking";

interface ShopCardProps {
  shop: Shop;
}

export function ShopCard({ shop }: ShopCardProps) {
  const expires = shop.subscribed_until
    ? new Date(shop.subscribed_until).toLocaleDateString("th-TH")
    : "—";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{shop.name}</h3>
          <p className="text-xs text-zinc-400">Status: {shop.status}</p>
          <p className="text-xs text-zinc-400">Expires: {expires}</p>
        </div>
        <span
          className={
            shop.status === "active"
              ? "rounded-full bg-emerald-700/30 px-2 py-0.5 text-xs text-emerald-300"
              : "rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300"
          }
        >
          {shop.status}
        </span>
      </div>
    </div>
  );
}
