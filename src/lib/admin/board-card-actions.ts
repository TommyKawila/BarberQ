import { allowsNoShow } from "@/lib/appointment-status";
import type { AdminSlot, AppointmentSource } from "@/types/booking";

export type BoardCardActionId =
  | "completed"
  | "left"
  | "no_show"
  | "late_called"
  | "cancel"
  | "reschedule"
  | "call";

/** Cancel is available for every booking source on the queue board. */
export const BOARD_CANCEL_SOURCES: readonly AppointmentSource[] = [
  "line",
  "walk_in",
  "phone",
  "chat",
] as const;

export interface BoardCardActionFlags {
  canOpenSheet: boolean;
  canComplete: boolean;
  canLeft: boolean;
  canNoShow: boolean;
  canLateCalled: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canCall: boolean;
  /** True when cancel confirm should mention LINE push (customer has LINE id). */
  cancelNotifiesLine: boolean;
  /** True when shop reschedule LINE push would be sent (customer has LINE id). */
  rescheduleNotifiesLine: boolean;
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
      canReschedule: false,
      canCall: false,
      cancelNotifiesLine: false,
      rescheduleNotifiesLine: false,
    };
  }

  const showNoShow = allowsNoShow(slot.source);
  const endPassed = new Date(slot.endTime).getTime() <= now;
  const canLateCalled =
    Boolean(slot.isLate) && slot.source !== "walk_in" && !slot.lateCalledAt;
  // Source must never gate cancel — phone/chat/walk-in/LINE all cancel.
  const sourceAllowsCancel =
    !slot.source || BOARD_CANCEL_SOURCES.includes(slot.source);
  const hasLine = Boolean(slot.customerLineId?.trim());

  return {
    canOpenSheet: true,
    canComplete: true,
    canLeft: !showNoShow,
    canNoShow: showNoShow && endPassed,
    canLateCalled,
    canCancel: sourceAllowsCancel,
    canReschedule: sourceAllowsCancel,
    canCall: Boolean(slot.customerPhone?.trim()),
    cancelNotifiesLine: hasLine,
    rescheduleNotifiesLine: hasLine,
  };
}
