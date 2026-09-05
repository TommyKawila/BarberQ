import { NextResponse } from "next/server";
import { getStaffFromToken } from "@/lib/admin-auth";
import { STAFF_LOGIN_SHORTCUTS } from "@/lib/admin/login-shortcuts";

export function staffLoginRedirect(req: Request, slug: string): Promise<NextResponse> {
  const token = STAFF_LOGIN_SHORTCUTS[slug];
  if (!token) {
    return Promise.resolve(NextResponse.redirect(new URL("/", req.url)));
  }
  return redirectWithToken(req, token);
}

export async function redirectWithToken(req: Request, token: string): Promise<NextResponse> {
  const staff = await getStaffFromToken(token);
  if (!staff) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.redirect(
    new URL(`/admin#token=${encodeURIComponent(token)}`, req.url),
  );
}
