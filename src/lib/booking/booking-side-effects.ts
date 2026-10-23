/**
 * After the appointment row is committed, confirm-push / reminder / schema
 * patches must never turn a successful booking into a client-facing failure.
 */

export async function runBookingSideEffect<T>(
  appointment: T,
  run: () => Promise<T>,
  meta?: { appointmentId?: string; event?: string },
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: meta?.event ?? "booking_post_insert_side_effect_error",
        appointmentId: meta?.appointmentId ?? null,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return appointment;
  }
}
