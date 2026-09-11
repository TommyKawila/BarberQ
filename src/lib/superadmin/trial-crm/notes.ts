import { MAX_TRIAL_LEAD_NOTE } from "@/lib/marketing/trial-leads";

export function validateNoteBody(body: unknown): string {
  if (typeof body !== "string") throw new Error("INVALID_NOTE");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("INVALID_NOTE");
  if (trimmed.length > MAX_TRIAL_LEAD_NOTE) throw new Error("NOTE_TOO_LONG");
  return trimmed;
}
