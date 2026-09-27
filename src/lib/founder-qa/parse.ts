export function parseSupabaseProjectRef(url: string | undefined): string | null {
  const value = url?.trim();
  if (!value) return null;
  try {
    const host = new URL(value).hostname.toLowerCase();
    const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match?.[1] ?? host;
  } catch {
    return null;
  }
}

export function parseAppHostname(url: string | undefined): string | null {
  const value = url?.trim();
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function looksLikeSecret(value: string): boolean {
  return /service_role|eyJ|bearer\s+[a-z0-9._-]+|invite=|code=|line[_-]?id/i.test(
    value,
  );
}
