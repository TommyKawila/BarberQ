"use client";

import { useEffect } from "react";
import { consumeLiffReturnPath, isLiffOAuthCallback } from "@/lib/line/liff-return";

export function LiffCallbackRedirect() {
  useEffect(() => {
    if (!isLiffOAuthCallback(window.location.search)) return;
    const path = consumeLiffReturnPath();
    window.location.replace(`${path}${window.location.search}`);
  }, []);

  return null;
}
