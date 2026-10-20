/** ClipperQ platform LINE OA (@404qsemd) — owners / sales, not shop OAs. */
export const CLIPPERQ_OA_ID = "@404qsemd";

/** Stable add-friend / chat handoff for trial signup via LINE. */
export const CLIPPERQ_OA_LINE_URL = "https://lin.ee/UUyRBzo";

/**
 * Prefer env support URL when set; otherwise ClipperQ OA lin.ee link.
 */
export function resolveClipperqSupportLineUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL?.trim();
  return fromEnv || CLIPPERQ_OA_LINE_URL;
}
