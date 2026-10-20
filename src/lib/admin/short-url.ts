/** Display-friendly booking URL for AD-23 (host + path, no protocol). */
export function shortBookingUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "") || "";
    return `${u.host}${path}`;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
