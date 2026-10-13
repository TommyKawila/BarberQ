import { NextResponse } from "next/server";
import { getShopLineChannelSecrets } from "@/lib/line/shop-channel";
import { verifyLineSignature } from "@/lib/line/signature";
import { handleShopLineWebhook } from "@/lib/line/webhook-handler";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const { shopId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  const secrets = await getShopLineChannelSecrets(shopId);
  if (!secrets.channelSecret) {
    return NextResponse.json({ error: "channel_not_configured" }, { status: 404 });
  }
  if (!verifyLineSignature(rawBody, secrets.channelSecret, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: Parameters<typeof handleShopLineWebhook>[1];
  try {
    body = JSON.parse(rawBody) as Parameters<typeof handleShopLineWebhook>[1];
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Respond quickly; process asynchronously.
  void handleShopLineWebhook(shopId, body).catch((err) => {
    console.warn(
      JSON.stringify({
        event: "line_webhook_handler_error",
        shopId,
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
  });

  return NextResponse.json({ ok: true });
}
