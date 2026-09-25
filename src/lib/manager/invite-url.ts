export function buildManagerInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const path = `/manager/join?code=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}
