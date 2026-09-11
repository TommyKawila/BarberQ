export function isPhoneContact(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, "");
  if (/^0\d{8,9}$/.test(digits)) return true;
  if (/^\+66\d{8,9}$/.test(digits)) return true;
  return false;
}

export function telHref(value: string): string | null {
  if (!isPhoneContact(value)) return null;
  const digits = value.replace(/[\s()-]/g, "");
  return `tel:${digits}`;
}

export function lineUrl(value: string): string | null {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "line.me" || host.endsWith(".line.me") || host === "lin.ee") {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
