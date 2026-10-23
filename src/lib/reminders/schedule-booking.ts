import { computeReminderSchedule } from "@/lib/reminders/resolve-lead";
import { patchAppointmentReminder } from "@/lib/reminders/reminder-store";
import type { Appointment } from "@/types/booking";

/**
 * Attach a reminder schedule to a newly created (or rescheduled) LINE booking.
 * No-op when shop reminders are off, source is not LINE, or no LINE userId.
 */
export async function scheduleBookingReminder(input: {
  shopId: string;
  shopRemindersEnabled: boolean;
  appointment: Appointment;
  preferredLeadMinutes: number | null | undefined;
  now?: Date;
  /** Reschedule: clear prior sent_at and recompute due. */
  recompute?: boolean;
}): Promise<Appointment> {
  const {
    shopId,
    shopRemindersEnabled,
    appointment,
    preferredLeadMinutes,
    now = new Date(),
    recompute = false,
  } = input;

  const source = appointment.source ?? "line";
  const canRemind =
    shopRemindersEnabled &&
    source === "line" &&
    Boolean(appointment.customer_line_id?.trim()) &&
    appointment.status === "confirmed";

  if (!canRemind) {
    if (recompute) {
      try {
        await patchAppointmentReminder(appointment.id, shopId, appointment, {
          leadMinutes: null,
          dueAt: null,
          clearSentAt: true,
        });
      } catch (error) {
        console.warn(
          JSON.stringify({
            event: "booking_reminder_patch_skipped",
            appointmentId: appointment.id,
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
      return {
        ...appointment,
        reminder_lead_minutes: null,
        reminder_due_at: null,
        reminder_sent_at: null,
      };
    }
    return appointment;
  }

  const schedule = computeReminderSchedule(preferredLeadMinutes, new Date(appointment.start_time), now);
  try {
    await patchAppointmentReminder(appointment.id, shopId, appointment, {
      leadMinutes: schedule?.leadMinutes ?? null,
      dueAt: schedule?.dueAt ?? null,
      clearSentAt: recompute,
    });
  } catch (error) {
    // Appointment already exists — never fail create/reschedule on reminder patch.
    console.warn(
      JSON.stringify({
        event: "booking_reminder_patch_skipped",
        appointmentId: appointment.id,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return appointment;
  }

  return {
    ...appointment,
    reminder_lead_minutes: schedule?.leadMinutes ?? null,
    reminder_due_at: schedule?.dueAt?.toISOString() ?? null,
    reminder_sent_at: recompute ? null : appointment.reminder_sent_at ?? null,
  };
}
