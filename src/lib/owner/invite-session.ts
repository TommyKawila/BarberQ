import { isLiffOAuthCallback } from "@/lib/line/liff-return";

export const OWNER_INVITE_KEY = "barberq_owner_invite";
export const OWNER_JOIN_PATH = "/owner/join";

export function isInviteOnlyQuery(search: string): boolean {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const code = params.get("code")?.trim();
  return Boolean(code && !params.get("liffClientId"));
}

export function resolveInviteCode(
  search: string,
  storedInvite: string | null | undefined,
): string | null {
  if (isLiffOAuthCallback(search)) {
    return storedInvite?.trim() || null;
  }
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const urlCode = params.get("code")?.trim();
  if (urlCode) return urlCode;
  return storedInvite?.trim() || null;
}

export function readStoredOwnerInvite(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(OWNER_INVITE_KEY);
    if (fromSession?.trim()) return fromSession.trim();
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${OWNER_INVITE_KEY}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim() || null;
  } catch {
    return null;
  }
}

export function saveOwnerInviteCode(code: string): void {
  if (typeof window === "undefined") return;
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(OWNER_INVITE_KEY, trimmed);
  } catch {
    /* ignore */
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${OWNER_INVITE_KEY}=${encodeURIComponent(trimmed)}; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

export function clearOwnerInviteCode(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(OWNER_INVITE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${OWNER_INVITE_KEY}=; Path=/; Max-Age=0`;
}

export function stripInviteFromUrl(): void {
  if (typeof window === "undefined") return;
  if (!isInviteOnlyQuery(window.location.search)) return;
  window.history.replaceState(null, "", OWNER_JOIN_PATH);
}

export function restoreOwnerInviteUrl(inviteCode: string): void {
  if (typeof window === "undefined") return;
  const trimmed = inviteCode.trim();
  if (!trimmed) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("liffClientId") || params.get("liff.state")) return;
  const target = `${OWNER_JOIN_PATH}?code=${encodeURIComponent(trimmed)}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== target) {
    window.history.replaceState(null, "", target);
  }
}

export function prepareOwnerJoinForLiff(): void {
  if (typeof window === "undefined") return;
  if (!isInviteOnlyQuery(window.location.search)) return;
  const invite = new URLSearchParams(window.location.search).get("code");
  if (invite) saveOwnerInviteCode(invite);
  stripInviteFromUrl();
}
