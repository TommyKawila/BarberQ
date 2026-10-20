import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";

export const runtime = "nodejs";

/** Public preview for barber LINE link-invite (no auth). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ preview: null }, { status: 404 });
  }
  const preview = await getStore().getBarberLineInvitePreview(code);
  if (!preview) {
    return NextResponse.json({ preview: null }, { status: 404 });
  }
  return NextResponse.json({ preview });
}
