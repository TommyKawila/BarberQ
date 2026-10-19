"use client";

import { useEffect, useState } from "react";

/** Browser online/offline for AD-17 system status. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function sync() {
      setOnline(navigator.onLine);
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

export function formatLastUpdated(date: Date, locale: "th" | "en"): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (locale === "th") return `อัปเดต ${hh}:${mm}`;
  return `Updated ${hh}:${mm}`;
}
