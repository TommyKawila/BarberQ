import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import type { BarberRole } from "@/types/booking";

const STATUS: Partial<Record<string, number>> = {
  BARBER_NOT_FOUND: 404,
  NOT_FOUND: 404,
};

function toSafeBarber(barber: {
  id: string;
  name: string;
  role?: BarberRole;
  shop_id?: string | null;
  line_id?: string | null;
}) {
  return {
    id: barber.id,
    name: barber.name,
    role: barber.role ?? "barber",
    shopId: barber.shop_id ?? null,
    lineLinked: Boolean(barber.line_id),
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shopId: string; barberId: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { shopId, barberId } = await params;
    const barber = await getStore().unlinkBarberLine(shopId, barberId);
    return NextResponse.json({ barber: toSafeBarber(barber) });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: STATUS[err.code] ?? 400 },
      );
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to unlink LINE" },
      { status: 500 },
    );
  }
}
