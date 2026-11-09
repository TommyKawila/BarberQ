import type { Locale } from "./dictionary";
import { isEnglishEnabled } from "./feature-flag";

/** Resolve UI locale. When English is off, always Thai — even if storage holds "en". */
export function resolveLocale(
  stored: string | null,
  englishEnabled: boolean = isEnglishEnabled(),
): Locale {
  if (!englishEnabled) return "th";
  return stored === "en" ? "en" : "th";
}
