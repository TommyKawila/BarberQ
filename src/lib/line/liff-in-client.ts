import { detectInAppBrowser } from "@/lib/browser/in-app-browser";

/**
 * Decide whether LINE login should use the in-LIFF / init-fail reload path.
 *
 * When LIFF init succeeded, trust `liff.isInClient()` only (unchanged).
 * When init failed / never finished, also treat a LINE in-app UA as in-client
 * so we clear + reload instead of falling through to web OAuth.
 */
export function resolveLiffLoginInClient(input: {
  initOk: boolean;
  /** Result of `liff.isInClient()` when readable; null if unavailable/throws. */
  sdkInClient: boolean | null;
  userAgent?: string;
}): boolean {
  if (input.initOk) {
    return input.sdkInClient === true;
  }
  if (input.sdkInClient === true) return true;
  const ua = input.userAgent ?? "";
  return detectInAppBrowser(ua).appName === "LINE";
}

/** Safe read of `liff.isInClient()` — null when the SDK is not ready. */
export function readLiffSdkInClient(api?: {
  isInClient?: () => boolean;
}): boolean | null {
  try {
    if (typeof api?.isInClient !== "function") return null;
    return Boolean(api.isInClient());
  } catch {
    return null;
  }
}
