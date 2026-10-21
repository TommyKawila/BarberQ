"use client";

import { WifiOff } from "lucide-react";

export function OfflineBanner({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-950/40 px-3 py-2.5 text-sm text-orange-100"
    >
      <WifiOff size={18} className="shrink-0 text-orange-300" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
