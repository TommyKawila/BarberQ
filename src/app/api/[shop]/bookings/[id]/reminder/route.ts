import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";
import { computeReminderSchedule } from "@/lib/reminders/resolve-lead";
import { CUSTOMER_REMINDER_CHIP_OPTIONS } from "@/lib/reminders/customer-chips";
import { patchAppointmentReminder } from "@/lib/reminders/reminder-store";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Customer: change reminder lead on own confirmed LINE booking (before sent). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shop: string; id: string }> },
) {
  try {
    const { shop: shopSlug, id: appointmentId } = await params;
    const shop = await resolveShopParam(shopSlug);
    const customer = await assertVerifiedCustomer(req);
    const body = await readJson<{ reminderLeadMinutes?: number | null }>(req);

    const store = getStore();
    const appointment = await store.getAppointment(appointmentId);
    if (!appointment) throw new BookingError("NOT_FOUND", "Appointment not found", 404);

    const barber = await store.getBarber(appointment.barber_id);
    if (!barber || barber.shop_id !== shop.id) {
      throw new BookingError("NOT_FOUND", "Appointment not found", 404);
    }
    if (appointment.customer_line_id !== customer.userId) {
      throw new BookingError("FORBIDDEN", "Not your booking", 403);
    }
    if (appointment.status !== "confirmed") {
      throw new BookingError("NOT_CANCELLABLE", "Booking cannot be updated", 400);
    }
    if (appointment.reminder_sent_at) {
      throw new BookingError("REMINDER_SENT", "Reminder already sent", 400);
    }

    const settings = await store.getShopSettings(shop.id);
    if (!settings.remindersEnabled) {
      throw new BookingError("REMINDERS_OFF", "Reminders are disabled for this shop", 400);
    }

    const preferred = body.reminderLeadMinutes;
    if (
      preferred != null &&
      preferred !== 0 &&
      !(CUSTOMER_REMINDER_CHIP_OPTIONS as readonly number[]).includes(preferred)
    ) {
      throw new BookingError("INVALID_REMINDER_LEAD", "Invalid reminder lead time", 400);
    }

    const schedule =
      preferred == null || preferred === 0
        ? null
        : computeReminderSchedule(preferred, new Date(appointment.start_time));

    await patchAppointmentReminder(appointment.id, shop.id, appointment, {
      leadMinutes: schedule?.leadMinutes ?? null,
      dueAt: schedule?.dueAt ?? null,
      clearSentAt: true,
    });

    return NextResponse.json({
      appointment: {
        ...appointment,
        reminder_lead_minutes: schedule?.leadMinutes ?? null,
        reminder_due_at: schedule?.dueAt?.toISOString() ?? null,
        reminder_sent_at: null,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
