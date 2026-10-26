"use client";

import { useEffect } from "react";
import {
  consumeLiffReturnPath,
  hasLiffCallbackGuard,
  resolveLiffCallbackAction,
  setLiffCallbackGuard,
} from "@/lib/line/liff-return";

/**
 * LIFF authorize often redirects to the Endpoint URL (`/`) with ?code=&liffClientId=.
 * We then forward to the path saved in cookie/session before login.
 *
 * If that cookie is missing (Safari started login, Chrome opened the callback),
 * NEVER replace with `/?code=…` again — that refreshes forever. Show a clear
 * retry page on /owner instead (max one automatic hop via session guard).
 */
export function LiffCallbackRedirect() {
  useEffect(() => {
    const search = window.location.search;
    const action = resolveLiffCallbackAction({
      search,
      returnPath: consumeLiffReturnPath(),
      guardAlreadySet: hasLiffCallbackGuard(),
    });
    if (action.type === "stop") return;
    setLiffCallbackGuard();
    window.location.replace(action.href);
  }, []);

  return null;
}
