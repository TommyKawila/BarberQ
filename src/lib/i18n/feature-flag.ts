/**
 * English UI locale gate (phase 1).
 * On only when NEXT_PUBLIC_ENABLE_ENGLISH is exactly "true".
 * Unset or any other value → off (default Thai-only).
 *
 * Literal `process.env.NEXT_PUBLIC_*` is required so Next.js inlines the
 * value into client bundles (LocaleProvider / LanguageToggle are "use client").
 */
const ENGLISH_FLAG = process.env.NEXT_PUBLIC_ENABLE_ENGLISH;

export function isEnglishEnabled(
  value: string | undefined = ENGLISH_FLAG,
): boolean {
  return value === "true";
}
