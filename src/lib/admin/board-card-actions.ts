import { allowsNoShow } from "@/lib/appointment-status";
import type { AdminSlot } from "@/types/booking";

export type BoardCardActionId =
  | "completed"
  | "left"
  | "no_show"
  | "late_called"
  | "cancel"
  | "call";

export interface BoardCardActionFlags {
  canOpenSheet: boolean;
  canComplete: boolean;
  canLeft: boolean;
  canNoShow: boolean;
  canLateCalled: boolean;
  canCancel: boolean;
  canCall: boolean;
}

/** Which staff actions are available on a booked board card. */
export function getBookedCardActions(
  slot: AdminSlot,
  opts: { canEdit: boolean; nowMs?: number } = { canEdit: true },
): BoardCardActionFlags {
  const now = opts.nowMs ?? Date.now();
  const confirmedBooked =
    slot.kind === "booked" &&
    slot.status === "confirmed" &&
    Boolean(slot.appointmentId) &&
    opts.canEdit;

  if (!confirmedBooked) {
    return {
      canOpenSheet: false,
      canComplete: false,
      canLeft: false,
      canNoShow: false,
      canLateCalled: false,
      canCancel: false,
      canCall: false,
    };
  }

  const showNoShow = allowsNoShow(slot.source);
  const endPassed = new Date(slot.endTime).getTime() <= now;
  const canLateCalled =
    Boolean(slot.isLate) && slot.source !== "walk_in" && !slot.lateCalledAt;

  return {
    canOpenSheet: true,
    canComplete: true,
    canLeft: !showNoShow,
    canNoShow: showNoShow && endPassed,
    canLateCalled,
    canCancel: true,
    canCall: Boolean(slot.customerPhone?.trim()),
  };
}
