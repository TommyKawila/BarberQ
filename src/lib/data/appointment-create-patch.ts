/**
 * Post-create appointment UPDATE after legacy create_appointment RPCs.
 * Production may lag migration 0026 (appointments.source) — never fail the
 * booking response solely because that column is missing.
 */

export type AppointmentCreatePatch = {
  customer_line_id?: string | null;
  source?: string;
  end_time?: string;
  customer_ref?: string | null;
  customer_phone?: string | null;
};

export function isMissingColumnError(
  error: { code?: string; message?: string },
  column: string,
): boolean {
  const msg = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    msg.toLowerCase().includes(column.toLowerCase())
  );
}

/** Drop `source` for DBs that have not applied migration 0026. */
export function appointmentPatchWithoutSource(
  patch: AppointmentCreatePatch,
): Omit<AppointmentCreatePatch, "source"> {
  const { source: _omit, ...rest } = patch;
  return rest;
}

/**
 * Decide the next patch attempt after an UPDATE error.
 * - missing `source` → retry without source
 * - otherwise → stop (caller may keep the already-created row)
 */
export function nextAppointmentCreatePatch(
  patch: AppointmentCreatePatch,
  error: { code?: string; message?: string },
): AppointmentCreatePatch | null {
  if ("source" in patch && patch.source !== undefined && isMissingColumnError(error, "source")) {
    return appointmentPatchWithoutSource(patch);
  }
  return null;
}
