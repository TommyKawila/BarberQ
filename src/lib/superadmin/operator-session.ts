const KEY = "barberq_operator_token";

export function readOperatorToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeOperatorToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!token) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
}
