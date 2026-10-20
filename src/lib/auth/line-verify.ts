import { assertProductionConfig, isProductionRuntime } from "@/lib/env";
import { isQaE2eBearerToken, verifyQaE2eToken } from "@/lib/qa-e2e/session";

export interface VerifiedLineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
}

export const MOCK_OWNER_LINE_ID = "mock-owner-line-id";

export function isLineAuthMockMode(): boolean {
  if (isProductionRuntime()) {
    assertProductionConfig();
    return false;
  }
  return !process.env.NEXT_PUBLIC_LIFF_ID?.trim();
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

export async function verifyLineAccessToken(
  accessToken: string,
): Promise<VerifiedLineUser | null> {
  const token = accessToken.trim();
  if (!token) return null;

  // QA-only signed bearer (barberq-qa + QA_E2E_SECRET). Never verifies on Production.
  if (isQaE2eBearerToken(token)) {
    const payload = verifyQaE2eToken(token);
    if (!payload) return null;
    return { userId: payload.lineUserId, displayName: "QA E2E" };
  }

  if (isLineAuthMockMode()) {
    return { userId: token };
  }

  try {
    const res = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      userId?: string;
      displayName?: string;
      pictureUrl?: string;
    };
    if (!data.userId) return null;
    return {
      userId: data.userId,
      displayName: data.displayName,
      pictureUrl: data.pictureUrl,
    };
  } catch {
    return null;
  }
}
