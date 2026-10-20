import {
  QA_E2E_CLIENT_STORAGE_KEY,
  type QaE2eClientSession,
} from "@/lib/qa-e2e/allowlist";

export function readQaE2eClientSession(): QaE2eClientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(QA_E2E_CLIENT_STORAGE_KEY);
    if (!raw) return null;
    if (raw.startsWith("qa-e2e.v1.")) {
      return { token: raw, lineUserId: "", shopSlug: "", role: "owner" };
    }
    const parsed = JSON.parse(raw) as QaE2eClientSession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeQaE2eClientSession(session: QaE2eClientSession): void {
  sessionStorage.setItem(QA_E2E_CLIENT_STORAGE_KEY, JSON.stringify(session));
}

export function clearQaE2eClientSession(): void {
  try {
    sessionStorage.removeItem(QA_E2E_CLIENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
