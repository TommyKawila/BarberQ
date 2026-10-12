export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || undefined;
}

export function getVapidPrivateKey(): string | undefined {
  return process.env.VAPID_PRIVATE_KEY?.trim() || undefined;
}

export function getVapidSubject(): string {
  return process.env.VAPID_SUBJECT?.trim() || "mailto:setup@barberqx.com";
}

export function isWebPushConfigured(): boolean {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}
