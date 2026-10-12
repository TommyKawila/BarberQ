export function shopLineWebhookUrl(shopId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/api/line/webhook/${shopId}`;
}

export function shopLineSetupEmail(shopId: string): string {
  const domain = process.env.BARBERQX_SETUP_EMAIL_DOMAIN?.trim() || "barberqx.com";
  return `setup+${shopId}@${domain}`;
}
