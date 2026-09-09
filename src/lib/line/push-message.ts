export async function pushText(lineUserId: string, text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const to = lineUserId.trim();
  if (!token || !to || !text.trim()) return false;

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
      console.warn("LINE push failed", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("LINE push error", err);
    return false;
  }
}
