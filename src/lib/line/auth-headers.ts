import liff from "@line/liff";
import { readQaE2eClientSession } from "@/lib/qa-e2e/client-session";

export function getLineAuthHeaders(userId?: string | null): HeadersInit {
  const qa = readQaE2eClientSession();
  if (qa?.token) {
    return { Authorization: `Bearer ${qa.token}` };
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    if (!userId) return {};
    return { Authorization: `Bearer ${userId}` };
  }
  try {
    const token = liff.getAccessToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
