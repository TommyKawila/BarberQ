/** Query flag for screenshot / local mock runs only. Never set by default. */
export const STATS_SAMPLE_QUERY_KEY = "cqSample";

/**
 * Whether the Summary subtitle may show "ข้อมูลตัวอย่าง".
 * Opt-in only via `?cqSample=1`. Must never be true by default in any
 * deployed build (production, QA, preview).
 */
export function shouldShowStatsSampleLabel(
  search: string | URLSearchParams | null | undefined,
): boolean {
  if (search == null) return false;
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  return params.get(STATS_SAMPLE_QUERY_KEY) === "1";
}
