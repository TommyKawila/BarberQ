export function buildOwnerInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const path = `/owner/join?code=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}
