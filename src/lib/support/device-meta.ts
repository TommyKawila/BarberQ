/** Client-side device / page metadata for support tickets (hidden fields). */
export function collectSupportDeviceMeta(pathname?: string): {
  pagePath: string;
  deviceInfo: string;
  appVersion: string;
} {
  const pagePath =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const deviceInfo = [
    nav?.userAgent ?? "unknown",
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "",
    nav?.language ?? "",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 500);
  const appVersion =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_APP_VERSION?.trim()) ||
    "web";
  return { pagePath, deviceInfo, appVersion };
}
