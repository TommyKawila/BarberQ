const RETURN_KEY = "barberq_liff_return";
export const LIFF_RETURN_COOKIE = RETURN_KEY;
const FALLBACK_PATH = "/phinxstudio";

export function isSafeReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function saveLiffReturnPath(pathname: string) {
  if (!isSafeReturnPath(pathname)) return;
  try {
    sessionStorage.setItem(RETURN_KEY, pathname);
  } catch {
    /* ignore */
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RETURN_KEY}=${encodeURIComponent(pathname)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

export function consumeLiffReturnPath(): string {
  try {
    const stored = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (stored && isSafeReturnPath(stored)) return stored;
  } catch {
    /* ignore */
  }
  return FALLBACK_PATH;
}

export function isLiffOAuthCallback(search: string): boolean {
  const params = new URLSearchParams(search);
  return Boolean(params.get("code") && params.get("liffClientId"));
}
