import {
  canCancelAt,
  canCustomerReschedule,
  MAX_RESCHEDULE_COUNT,
} from "@/lib/services/slot-service";

export type CancelPageRescheduleBlock =
  | "used"
  | "too_late"
  | "not_confirmed"
  | null;

export type CancelPageActions = {
  cancellable: boolean;
  reschedulable: boolean;
  /** Why เลื่อนคิว is unavailable when still looking at a live booking. */
  rescheduleBlock: CancelPageRescheduleBlock;
};

/** Pure rules for /c/{token} action buttons (matches bookings page gates). */
export function cancelPageActions(
  apt: {
    status: string;
    start_time: string;
    reschedule_count?: number | null;
    cancel_token?: string | null;
  },
  now: Date = new Date(),
): CancelPageActions {
  const confirmed = apt.status === "confirmed";
  const cancellable = confirmed && canCancelAt(apt.start_time, now);
  const reschedulable = canCustomerReschedule(apt, now);

  let rescheduleBlock: CancelPageRescheduleBlock = null;
  if (reschedulable) {
    rescheduleBlock = null;
  } else if (!confirmed) {
    rescheduleBlock = "not_confirmed";
  } else if ((apt.reschedule_count ?? 0) >= MAX_RESCHEDULE_COUNT) {
    rescheduleBlock = "used";
  } else if (!canCancelAt(apt.start_time, now) || !apt.cancel_token) {
    rescheduleBlock = "too_late";
  }

  return { cancellable, reschedulable, rescheduleBlock };
}
