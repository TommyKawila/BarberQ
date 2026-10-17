import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  resolveBareShopPath,
  resolveLiffStateTarget,
  shopSlugFromPath,
} from "@/lib/line/liff-deep-link";
import { isSafeReturnPath, LIFF_RETURN_COOKIE } from "@/lib/line/liff-return";

const DEFAULT_SHOP = "phinxstudio";
const LAST_SHOP_COOKIE = "barberq_last_shop";

function redirectWithoutLiffParams(request: NextRequest, pathname: string) {
  const url = new URL(pathname, request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (!key.startsWith("liff.")) {
      url.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(url);
}

function liffReturnPathFromCookie(request: NextRequest): string | null {
  const raw = request.cookies.get(LIFF_RETURN_COOKIE)?.value;
  if (!raw) return null;
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!isSafeReturnPath(path) || path === "/") return null;
  return path;
}

function withLastShopCookie(res: NextResponse, shop: string): NextResponse {
  res.cookies.set(LAST_SHOP_COOKIE, shop, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;

  if (
    path === "/" &&
    url.searchParams.get("code") &&
    url.searchParams.get("liffClientId")
  ) {
    const returnPath = liffReturnPathFromCookie(request);
    if (returnPath) {
      const dest = new URL(returnPath, request.url);
      url.searchParams.forEach((value, key) => {
        dest.searchParams.set(key, value);
      });
      const res = NextResponse.redirect(dest);
      res.cookies.set(LIFF_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
  }

  const liffState = url.searchParams.get("liff.state");
  if (liffState) {
    const targetPath = resolveLiffStateTarget(path, liffState);
    if (targetPath !== path || url.searchParams.has("liff.state")) {
      const res = redirectWithoutLiffParams(request, targetPath);
      const shop = shopSlugFromPath(targetPath);
      if (shop) return withLastShopCookie(res, shop);
      return res;
    }
  }

  const duplicateMatch = path.match(/^\/([^/]+)\/\1(\/.*)?$/);
  if (duplicateMatch) {
    const dest = `/${duplicateMatch[1]}${duplicateMatch[2] ?? ""}`;
    const res = NextResponse.redirect(new URL(dest, request.url));
    return withLastShopCookie(res, duplicateMatch[1]);
  }

  // Legacy Flex links used /{shop}/c/{token}; real page is global /c/{token}.
  const shopCancelMatch = path.match(/^\/([^/]+)\/c\/([^/]+)\/?$/);
  if (shopCancelMatch) {
    const shopSeg = shopCancelMatch[1] ?? "";
    const token = shopCancelMatch[2] ?? "";
    if (shopSeg && token && shopSlugFromPath(`/${shopSeg}`)) {
      const res = NextResponse.redirect(new URL(`/c/${token}`, request.url));
      return withLastShopCookie(res, shopSeg);
    }
  }

  // Bare customer paths (LIFF secondary /bookings without shop in URL).
  // Never send these to the marketing home page.
  if (path === "/bookings" || path.startsWith("/bookings/")) {
    const lastShop = request.cookies.get(LAST_SHOP_COOKIE)?.value;
    const dest = resolveBareShopPath(path, lastShop, DEFAULT_SHOP);
    const res = NextResponse.redirect(new URL(dest, request.url));
    const shop = shopSlugFromPath(dest);
    if (shop) return withLastShopCookie(res, shop);
    return res;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    const lastShop = request.cookies.get(LAST_SHOP_COOKIE)?.value;
    const dest = resolveBareShopPath(path, lastShop, DEFAULT_SHOP);
    const res = NextResponse.redirect(new URL(dest, request.url));
    const shop = shopSlugFromPath(dest);
    if (shop) return withLastShopCookie(res, shop);
    return res;
  }

  const shop = shopSlugFromPath(path);
  if (shop) {
    return withLastShopCookie(NextResponse.next(), shop);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
