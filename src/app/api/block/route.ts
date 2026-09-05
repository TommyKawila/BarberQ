import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { isPrototypeMode } from "@/lib/data";
import { isAdminKeyRequired } from "@/lib/env";
import {
  createBlock,
  getAdminDay,
  removeBlock,
} from "@/lib/services/booking-service";
import { dateISOFromInstant } from "@/lib/services/slot-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? dateISOFromInstant(new Date());
    const columns = await getAdminDay(date);
    return NextResponse.json({
      date,
      columns,
      prototypeMode: isPrototypeMode(),
      adminKeyRequired: isAdminKeyRequired(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const body = await readJson<{
      barberId?: string;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }>(req);
    const block = await createBlock({
      barberId: body.barberId ?? "",
      startTime: body.startTime ?? "",
      endTime: body.endTime ?? "",
      reason: body.reason,
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    assertAdmin(req);
    const body = await readJson<{ id?: string }>(req);
    await removeBlock(body.id ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
