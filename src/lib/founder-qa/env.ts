export const BARBERQ_ENV_VALUES = ["local", "founder_qa", "production"] as const;
export type BarberqEnv = (typeof BARBERQ_ENV_VALUES)[number];

export function parseBarberqEnv(
  raw: string | undefined,
): BarberqEnv | "missing" | "unknown" {
  const value = raw?.trim();
  if (!value) return "missing";
  if ((BARBERQ_ENV_VALUES as readonly string[]).includes(value)) {
    return value as BarberqEnv;
  }
  return "unknown";
}

export function readBarberqEnv(
  env: NodeJS.ProcessEnv = process.env,
): BarberqEnv | "missing" | "unknown" {
  return parseBarberqEnv(env.BARBERQ_ENV);
}
