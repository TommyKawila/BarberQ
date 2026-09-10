import { NextResponse } from "next/server";
import { redirectWithToken } from "@/lib/admin/login-redirect";
import { getStaffFromToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const staff = await getStaffFromToken(token);
  if (!staff) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return redirectWithToken(req, token);
}
