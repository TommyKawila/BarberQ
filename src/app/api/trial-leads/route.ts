import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { BookingError } from "@/lib/services/booking-service";
import {
  isHoneypotTriggered,
  validateTrialLeadPayload,
} from "@/lib/marketing/trial-leads";
import { getClientIp, isTrialRateLimited } from "@/lib/marketing/trial-rate-limit";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isTrialRateLimited(ip)) {
      throw new BookingError("RATE_LIMIT", "Too many requests", 429);
    }

    const body = await readJson<Record<string, unknown>>(req);

    if (isHoneypotTriggered(body.website)) {
      return NextResponse.json({ ok: true });
    }

    const input = validateTrialLeadPayload(body);
    const lead = await getStore().createTrialLead(input);
    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err) {
    if (err instanceof BookingError && err.code === "RATE_LIMIT") {
      return jsonError(err);
    }
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof Error) {
      const msg = err.message;
      if (
        msg.startsWith("INVALID_") ||
        msg === "INVALID_CREDENTIAL_FIELD"
      ) {
        return NextResponse.json(
          { error: { code: "VALIDATION", message: "Invalid input" } },
          { status: 400 },
        );
      }
    }
    return jsonError(err);
  }
}
