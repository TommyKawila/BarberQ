import { getOptionalLinePushToken } from "@/lib/env";

export async function pushText(lineUserId: string, text: string): Promise<boolean> {
  const token = getOptionalLinePushToken();
  const to = lineUserId.trim();
  if (!token) {
    console.warn(
      JSON.stringify({
        event: "line_push_skipped",
        reason: "missing_channel_access_token",
      }),
    );
    return false;
  }
  if (!to || !text.trim()) return false;

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      console.warn(
        JSON.stringify({
          event: "line_push_failed",
          status: res.status,
        }),
      );
      return false;
    }
    return true;
  } catch {
    console.warn(JSON.stringify({ event: "line_push_error" }));
    return false;
  }
}
