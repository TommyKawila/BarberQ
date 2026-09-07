import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_SHOP = "phinxstudio";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/bookings") {
    return NextResponse.redirect(new URL(`/${DEFAULT_SHOP}/bookings`, request.url));
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    const suffix = path === "/admin" ? "/admin" : path.slice("/admin".length);
    return NextResponse.redirect(new URL(`/${DEFAULT_SHOP}${suffix}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/bookings", "/admin", "/admin/:path*"],
};
