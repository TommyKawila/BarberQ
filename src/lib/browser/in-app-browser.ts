const IN_APP_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bFBAN|FBAV|FB_IAB|Messenger\b/i, label: "Messenger" },
  { pattern: /\bInstagram\b/i, label: "Instagram" },
  { pattern: /\bLine\//i, label: "LINE" },
  { pattern: /\bMicroMessenger\b/i, label: "WeChat" },
  { pattern: /\bTwitter\b/i, label: "Twitter" },
  { pattern: /\bLinkedInApp\b/i, label: "LinkedIn" },
];

export function detectInAppBrowser(userAgent: string): { inApp: boolean; appName: string | null } {
  for (const entry of IN_APP_PATTERNS) {
    if (entry.pattern.test(userAgent)) {
      return { inApp: true, appName: entry.label };
    }
  }
  return { inApp: false, appName: null };
}

export function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

export function isIos(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function buildChromeIntentUrl(httpsUrl: string): string {
  const url = new URL(httpsUrl);
  const fallback = encodeURIComponent(httpsUrl);
  const path = `${url.pathname}${url.search}`;
  return `intent://${url.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

export function buildIosChromeUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https:\/\//, "googlechromes://");
}
