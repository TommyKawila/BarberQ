import { NextResponse } from "next/server";
import { getStaffFromToken, type StaffAuth } from "@/lib/admin-auth";
import { STAFF_LOGIN_SHORTCUTS } from "@/lib/admin/login-shortcuts";
import { getStore } from "@/lib/data";

export function staffLoginRedirect(req: Request, slug: string): Promise<NextResponse> {
  const token = STAFF_LOGIN_SHORTCUTS[slug];
  if (!token) {
    return Promise.resolve(NextResponse.redirect(new URL("/", req.url)));
  }
  return redirectWithToken(req, token);
}

async function shopSlugForStaff(staff: StaffAuth): Promise<string | null> {
  const shops = await getStore().listShops();
  return shops.find((shop) => shop.id === staff.shopId)?.slug ?? null;
}

export async function redirectWithToken(req: Request, token: string): Promise<NextResponse> {
  const staff = await getStaffFromToken(token);
  if (!staff) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const slug = await shopSlugForStaff(staff);
  if (!slug) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.redirect(
    new URL(`/${slug}/admin?token=${encodeURIComponent(token)}`, req.url),
  );
}
