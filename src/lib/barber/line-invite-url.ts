export function buildBarberLineInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const path = `/barber/join?code=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

/** Official LINE share plugin — opens share sheet with the invite URL. */
export function buildLineShareUrl(inviteUrl: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteUrl)}`;
}
