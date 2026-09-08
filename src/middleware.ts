import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_SHOP = "phinxstudio";

function redirectWithoutLiffParams(request: NextRequest, pathname: string) {
  const url = new URL(pathname, request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (!key.startsWith("liff.")) {
      url.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;

  const liffState = url.searchParams.get("liff.state");
  if (liffState) {
    const targetPath = liffState.startsWith("/") ? liffState : `/${liffState}`;
    if (targetPath !== path) {
      return redirectWithoutLiffParams(request, targetPath);
    }
    if (url.searchParams.has("liff.state")) {
      return redirectWithoutLiffParams(request, path);
    }
  }

  const duplicateMatch = path.match(/^\/([^/]+)\/\1(\/.*)?$/);
  if (duplicateMatch) {
    return NextResponse.redirect(
      new URL(`/${duplicateMatch[1]}${duplicateMatch[2] ?? ""}`, request.url),
    );
  }

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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
