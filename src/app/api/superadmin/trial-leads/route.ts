import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { TRIAL_LEAD_STATUSES, type TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const leads = await getStore().listTrialLeads();
    return NextResponse.json({ leads });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Unauthorized" ? 401 : 403 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = await readJson<{ id?: string; status?: string }>(req);
    const id = body.id?.trim();
    const status = body.status as TrialLeadStatus;
    if (!id || !status || !TRIAL_LEAD_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
    }
    const lead = await getStore().updateTrialLeadStatus(id, status);
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
