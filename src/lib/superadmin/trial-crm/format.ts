import { format } from "date-fns";
import { enUS, th } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/dictionary";

export function formatLeadDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy HH:mm", { locale: locale === "th" ? th : enUS });
}

export function formatLeadDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy", { locale: locale === "th" ? th : enUS });
}

export function displayOrDash(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}
