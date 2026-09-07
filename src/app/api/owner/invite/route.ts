import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const preview = await getStore().getShopInvitePreview(code);
  if (!preview) {
    return NextResponse.json({ error: { code: "INVITE_NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ preview });
}
