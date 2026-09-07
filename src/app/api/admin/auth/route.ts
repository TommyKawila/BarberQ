import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");

  if (!lineId) {
    return NextResponse.json({ error: "Missing lineId" }, { status: 400 });
  }

  const barber = await getStore().getBarberByLineId(lineId);
  if (!barber) {
    return NextResponse.json({ error: "Unauthorized - Line ID not found" }, { status: 403 });
  }

  return NextResponse.json({
    barberId: barber.id,
    barberName: barber.name,
    role: barber.role ?? "barber",
    shopId: barber.shop_id ?? null,
  });
}
