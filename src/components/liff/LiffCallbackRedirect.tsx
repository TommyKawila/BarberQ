"use client";

import { useEffect } from "react";
import {
  consumeLiffReturnPath,
  hasLiffCallbackGuard,
  oauthCodeFromSearch,
  peekLastShopReturnPath,
  resolveLiffCallbackAction,
  setLiffCallbackGuard,
} from "@/lib/line/liff-return";

/**
 * LIFF authorize often redirects to the Endpoint URL (`/`) with ?code=&liffClientId=.
 * We then forward to the path saved in cookie/session before login.
 *
 * If that cookie is missing (Safari Private / browser switch), try last-shop
 * cookie before stopping on marketing `/`. Never self-replace with `/?code=…`.
 */
export function LiffCallbackRedirect() {
  useEffect(() => {
    const search = window.location.search;
    const oauthCode = oauthCodeFromSearch(search);
    const action = resolveLiffCallbackAction({
      search,
      returnPath: consumeLiffReturnPath(),
      fallbackShopPath: peekLastShopReturnPath(),
      guardAlreadySet: hasLiffCallbackGuard(oauthCode),
    });
    if (action.type === "stop") return;
    setLiffCallbackGuard(oauthCode);
    window.location.replace(action.href);
  }, []);

  return null;
}
