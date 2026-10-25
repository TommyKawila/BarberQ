const LINE_API = "https://api.line.me";

export interface LineBotInfo {
  userId: string;
  basicId: string;
  displayName: string;
  pictureUrl?: string;
  chatMode?: string;
  markAsReadMode?: string;
}

export interface LineQuota {
  type: "none" | "limited";
  value?: number;
}

export interface LineQuotaConsumption {
  totalUsage: number;
}

async function lineFetch(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${LINE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function getBotInfo(accessToken: string): Promise<LineBotInfo> {
  const res = await lineFetch("/v2/bot/info", accessToken);
  if (!res.ok) {
    throw new Error(`LINE_BOT_INFO_${res.status}`);
  }
  return (await res.json()) as LineBotInfo;
}

/** GET /v2/bot/channel/webhook/endpoint — webhook URL + active flag. */
export interface LineWebhookEndpointInfo {
  endpoint: string;
  active: boolean;
}

export async function getWebhookEndpoint(
  accessToken: string,
): Promise<LineWebhookEndpointInfo> {
  const res = await lineFetch("/v2/bot/channel/webhook/endpoint", accessToken);
  if (!res.ok) {
    throw new Error(`LINE_WEBHOOK_ENDPOINT_${res.status}`);
  }
  return (await res.json()) as LineWebhookEndpointInfo;
}

export async function getMessageQuota(accessToken: string): Promise<LineQuota> {
  const res = await lineFetch("/v2/bot/message/quota", accessToken);
  if (!res.ok) {
    throw new Error(`LINE_QUOTA_${res.status}`);
  }
  return (await res.json()) as LineQuota;
}

export async function getMessageQuotaConsumption(
  accessToken: string,
): Promise<LineQuotaConsumption> {
  const res = await lineFetch("/v2/bot/message/quota/consumption", accessToken);
  if (!res.ok) {
    throw new Error(`LINE_QUOTA_CONSUMPTION_${res.status}`);
  }
  return (await res.json()) as LineQuotaConsumption;
}

export async function replyMessages(
  accessToken: string,
  replyToken: string,
  messages: unknown[],
): Promise<boolean> {
  const res = await lineFetch("/v2/bot/message/reply", accessToken, {
    method: "POST",
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    console.warn(JSON.stringify({ event: "line_reply_failed", status: res.status }));
    return false;
  }
  return true;
}

export async function pushMessages(
  accessToken: string,
  to: string,
  messages: unknown[],
): Promise<{ ok: boolean; status: number }> {
  const res = await lineFetch("/v2/bot/message/push", accessToken, {
    method: "POST",
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    console.warn(JSON.stringify({ event: "line_push_failed", status: res.status }));
  }
  return { ok: res.ok, status: res.status };
}
