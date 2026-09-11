import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { TRIAL_LEAD_STATUSES, type TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { parseFollowUpAt } from "@/lib/superadmin/trial-crm/follow-up";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

function unauthorized(err: unknown) {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unauthorized" },
    { status: err instanceof Error && err.message === "Unauthorized" ? 401 : 403 },
  );
}

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const leads = await getStore().listTrialLeads();
    return NextResponse.json({ leads });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return unauthorized(err);
  }
}

export async function PATCH(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = await readJson<Record<string, unknown>>(req);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
    const hasFollow = Object.prototype.hasOwnProperty.call(body, "followUpAt");
    if (!id || (!hasStatus && !hasFollow)) {
      return NextResponse.json({ error: "Invalid id or payload" }, { status: 400 });
    }

    const patch: { status?: TrialLeadStatus; followUpAt?: string | null } = {};
    if (hasStatus) {
      const status = body.status as TrialLeadStatus;
      if (!TRIAL_LEAD_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
      }
      patch.status = status;
    }
    if (hasFollow) {
      try {
        patch.followUpAt = parseFollowUpAt(body.followUpAt);
      } catch {
        return NextResponse.json({ error: "Invalid follow-up" }, { status: 400 });
      }
    }

    const lead = await getStore().updateTrialLead(id, patch);
    return NextResponse.json({ lead });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 },
    );
  }
}
