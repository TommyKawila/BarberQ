"use client";

import { useEffect } from "react";

/** Stable /pricing → sales #pricing (hash-safe client handoff). */
export default function PricingRedirectPage() {
  useEffect(() => {
    window.location.replace("/#pricing");
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 text-zinc-200">
      <p className="text-sm">
        กำลังเปิดหน้าราคา…{" "}
        <a href="/#pricing" className="font-medium text-amber-400 underline">
          ไปที่ #pricing
        </a>
      </p>
    </main>
  );
}