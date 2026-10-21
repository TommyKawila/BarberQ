import type { MessageKey } from "@/lib/i18n/dictionary";
import type { WalkInAssessment } from "@/lib/admin/walk-in-quick";

export type StaffErrorContext = {
  barberName?: string;
  timeLabel?: string;
  nextFreeLabel?: string;
  openLabel?: string;
};

/** Map API BookingError codes → i18n keys (never surface raw English API text). */
export function staffBookingErrorKey(code: string | undefined): MessageKey {
  switch (code) {
    case "SLOT_TAKEN":
    case "SLOT_BLOCKED":
      return "admin.walkIn.slotTaken";
    case "SHOP_CLOSED":
      return "admin.walkIn.shopNotOpen";
    case "BARBER_OFF":
      return "admin.walkIn.barberOff";
    case "SLOT_PAST":
      return "admin.staffBook.slotPast";
    case "FORBIDDEN":
      return "admin.toast.noPermission";
    case "INVALID_NAME":
      return "admin.staffBook.invalidName";
    case "INVALID_PHONE":
      return "admin.staffBook.invalidPhone";
    case "INVALID_TIME":
    case "INVALID_RANGE":
      return "admin.staffBook.invalidTime";
    case "BARBER_NOT_FOUND":
      return "admin.staffBook.barberNotFound";
    default:
      return "admin.updateFailed";
  }
}

function fill(template: string, ctx: StaffErrorContext): string {
  return template
    .replace("{barber}", ctx.barberName ?? "—")
    .replace("{time}", ctx.timeLabel ?? ctx.openLabel ?? "—")
    .replace("{next}", ctx.nextFreeLabel ?? "—")
    .replace("{open}", ctx.openLabel ?? "—");
}

/**
 * Human message for staff-booking API failures.
 * Always i18n — never return `error.message` from the API.
 */
export function staffBookingErrorMessage(
  code: string | undefined,
  t: (key: MessageKey) => string,
  ctx: StaffErrorContext = {},
): string {
  if (code === "SLOT_TAKEN" || code === "SLOT_BLOCKED") {
    if (ctx.nextFreeLabel) {
      return fill(t("admin.walkIn.slotTaken"), ctx);
    }
    return fill(t("admin.walkIn.slotTakenNoNext"), ctx);
  }
  if (code === "SHOP_CLOSED") {
    if (ctx.openLabel) {
      return fill(t("admin.walkIn.shopNotOpen"), { ...ctx, timeLabel: ctx.openLabel });
    }
    return fill(t("admin.walkIn.shopClosed"), {
      ...ctx,
      timeLabel: ctx.openLabel ?? "—",
    });
  }
  return fill(t(staffBookingErrorKey(code)), ctx);
}

/** Copy for a client-side Walk-in gate (before calling the API). */
export function walkInAssessmentMessage(
  assessment: WalkInAssessment,
  t: (key: MessageKey) => string,
): string {
  switch (assessment.kind) {
    case "shop_before_open":
      return t("admin.walkIn.shopNotOpen").replace("{time}", assessment.openLabel);
    case "shop_after_close":
      return t("admin.walkIn.shopClosed").replace(
        "{time}",
        assessment.nextOpenLabel ?? "—",
      );
    case "shop_closed_day":
      return t("admin.walkIn.shopClosedDay").replace(
        "{time}",
        assessment.nextOpenLabel ?? "—",
      );
    case "barber_off":
      return t("admin.walkIn.barberOff").replace("{barber}", assessment.barberName || "—");
    case "busy":
      return t("admin.walkIn.busyOffer")
        .replace("{barber}", assessment.barberName || "—")
        .replace("{time}", assessment.nextFreeLabel);
    case "no_slot":
      return t("admin.walkIn.noSlot").replace("{barber}", assessment.barberName || "—");
    case "ok":
      return "";
  }
}

/** Short visible label under a gated Walk-in button (grid / iPad — no tooltip). */
export function walkInDisabledLabel(
  assessment: WalkInAssessment,
  t: (key: MessageKey) => string,
): string {
  switch (assessment.kind) {
    case "shop_before_open":
      return t("admin.walkIn.shopNotOpen").replace("{time}", assessment.openLabel);
    case "shop_after_close":
      return t("admin.walkIn.gridClosed");
    case "shop_closed_day":
      return t("admin.walkIn.gridOffDay");
    case "barber_off":
      return t("admin.walkIn.gridOffDay");
    default:
      return walkInAssessmentMessage(assessment, t);
  }
}

/** Shop-level banner above the grid when every editable Walk-in is gated the same way. */
export function walkInShopBannerLabel(
  assessments: WalkInAssessment[],
  t: (key: MessageKey) => string,
): string | null {
  const gated = assessments.filter(
    (a) =>
      a.kind === "shop_before_open" ||
      a.kind === "shop_after_close" ||
      a.kind === "shop_closed_day",
  );
  if (gated.length === 0) return null;
  // Prefer before-open (includes open time) when present.
  const before = gated.find((a) => a.kind === "shop_before_open");
  if (before) return walkInDisabledLabel(before, t);
  return walkInDisabledLabel(gated[0]!, t);
}
