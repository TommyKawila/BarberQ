"use client";

import { useEffect } from "react";
import {
  consumeLiffReturnPath,
  hasLiffCallbackGuard,
  oauthCodeFromSearch,
  resolveLiffCallbackAction,
  setLiffCallbackGuard,
} from "@/lib/line/liff-return";

/**
 * LIFF authorize often redirects to the Endpoint URL (`/`) with ?code=&liffClientId=.
 * We then forward to the path saved in cookie/session before login.
 *
 * If that cookie is missing (Safari started login, Chrome opened the callback),
 * NEVER replace with `/?code=…` again — that refreshes forever. Stop on `/`
 * for customer/admin/claim; owner mismatch UX is handled on `/owner` itself
 * (path-specific redirectUri). Guard is bound to OAuth `code` and cleared on
 * each new `saveLiffReturnPath` so a later login in the same tab can forward.
 */
export function LiffCallbackRedirect() {
  useEffect(() => {
    const search = window.location.search;
    const oauthCode = oauthCodeFromSearch(search);
    const action = resolveLiffCallbackAction({
      search,
      returnPath: consumeLiffReturnPath(),
      guardAlreadySet: hasLiffCallbackGuard(oauthCode),
    });
    if (action.type === "stop") return;
    setLiffCallbackGuard(oauthCode);
    window.location.replace(action.href);
  }, []);

  return null;
}
