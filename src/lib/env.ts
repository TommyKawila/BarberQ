export type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "ADMIN_SECRET_KEY";

export type ProductionRequiredKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "NEXT_PUBLIC_LIFF_ID"
  | "NEXT_PUBLIC_APP_URL"
  | "SUPERADMIN_TOKEN";

const PRODUCTION_REQUIRED_KEYS: ProductionRequiredKey[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_LIFF_ID",
  "NEXT_PUBLIC_APP_URL",
  "SUPERADMIN_TOKEN",
];

export class EnvConfigError extends Error {
  readonly missingKeys: ProductionRequiredKey[];

  constructor(missingKeys: ProductionRequiredKey[]) {
    super(`Missing required production environment: ${missingKeys.join(", ")}`);
    this.name = "EnvConfigError";
    this.missingKeys = missingKeys;
  }
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getMissingProductionKeys(): ProductionRequiredKey[] {
  return PRODUCTION_REQUIRED_KEYS.filter((key) => !readEnv(key));
}

export function assertProductionConfig(): void {
  if (!isProductionRuntime()) return;
  const missing = getMissingProductionKeys();
  if (missing.length > 0) {
    throw new EnvConfigError(missing);
  }
}

export function getOptionalEnv(key: EnvKey): string | undefined {
  return readEnv(key);
}

export function getEnv(key: EnvKey): string {
  const value = getOptionalEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalLinePushToken(): string | undefined {
  return readEnv("LINE_CHANNEL_ACCESS_TOKEN");
}

export function getOptionalLineOaAddUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_LINE_OA_ADD_URL");
}

export function getOptionalBarberqSupportLineUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL");
}

export function isAdminKeyRequired(): boolean {
  return !!(
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}
