import liff from "@line/liff";

export function getLineAuthHeaders(userId?: string | null): HeadersInit {
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
