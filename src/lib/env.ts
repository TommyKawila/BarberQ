export type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "ADMIN_SECRET_KEY";

const PUBLIC_ENV: Record<Extract<EnvKey, `NEXT_PUBLIC_${string}`>, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const SERVER_ENV: Record<Exclude<EnvKey, `NEXT_PUBLIC_${string}`>, string | undefined> = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
};

export function getOptionalEnv(key: EnvKey): string | undefined {
  const value = key.startsWith("NEXT_PUBLIC_")
    ? PUBLIC_ENV[key as keyof typeof PUBLIC_ENV]
    : SERVER_ENV[key as keyof typeof SERVER_ENV];
  return value || undefined;
}

export function getEnv(key: EnvKey): string {
  const value = getOptionalEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function isAdminKeyRequired(): boolean {
  return !(
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
