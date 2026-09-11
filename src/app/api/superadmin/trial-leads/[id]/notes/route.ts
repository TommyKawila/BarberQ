import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { validateNoteBody } from "@/lib/superadmin/trial-crm/notes";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

function authError(err: unknown) {
  if (err instanceof Error && err.message === "Unauthorized") {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unauthorized" },
    { status: 403 },
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { id } = await params;
    const notes = await getStore().listTrialLeadNotes(id);
    return NextResponse.json({ notes });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof StoreConflict && err.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return authError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { id } = await params;
    const payload = await readJson<{ body?: unknown }>(req);
    let body: string;
    try {
      body = validateNoteBody(payload.body);
    } catch (err) {
      const code = err instanceof Error ? err.message : "INVALID_NOTE";
      return NextResponse.json({ error: code }, { status: 400 });
    }
    const note = await getStore().createTrialLeadNote(id, body);
    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof StoreConflict && err.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return authError(err);
  }
}
