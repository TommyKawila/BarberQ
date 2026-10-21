import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import {
  QA_E2E_COOKIE,
  QA_E2E_FIXTURE_SHOP_SLUG,
} from "@/lib/qa-e2e/allowlist";
import {
  assertRequestHostAllowed,
  evaluateQaE2eGuards,
  isQaE2eEnabled,
} from "@/lib/qa-e2e/guards";
import { mintQaE2eToken, verifyQaE2eToken } from "@/lib/qa-e2e/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hostFromRequest(req: Request): string {
  const url = new URL(req.url);
  return (
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    url.hostname
  );
}

function disabledResponse() {
  return NextResponse.json({ ok: false, enabled: false }, { status: 404 });
}

function readSecret(req: Request): string | null {
  return (
    req.headers.get("x-qa-e2e-secret")?.trim() ||
    new URL(req.url).searchParams.get("secret")?.trim() ||
    null
  );
}

async function resolveQaOwner() {
  const store = getStore();
  const shop = await store.getShopBySlug(QA_E2E_FIXTURE_SHOP_SLUG);
  if (!shop || shop.status !== "active") return null;
  const barbers = await store.listBarbersByShop(shop.id);
  const owner = barbers.find(
    (b) => b.role === "owner" && b.is_active !== false && b.line_id,
  );
  if (!owner?.line_id) return null;
  return {
    lineUserId: owner.line_id,
    shopSlug: shop.slug,
    role: "owner" as const,
    barberName: owner.name,
  };
}

/** Status: is E2E session available / active for this browser? */
export async function GET(req: Request) {
  if (!isQaE2eEnabled()) return disabledResponse();
  try {
    assertRequestHostAllowed(hostFromRequest(req));
  } catch {
    return disabledResponse();
  }

  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${QA_E2E_COOKIE}=`));
  const raw = cookie ? decodeURIComponent(cookie.slice(QA_E2E_COOKIE.length + 1)) : "";
  const payload = raw ? verifyQaE2eToken(raw) : null;

  return NextResponse.json({
    ok: true,
    enabled: true,
    reason: evaluateQaE2eGuards().reason,
    authenticated: Boolean(payload),
    lineUserId: payload?.lineUserId ?? null,
    shopSlug: payload?.shopSlug ?? null,
    role: payload?.role ?? null,
  });
}

/**
 * Mint a QA-only staff session.
 * Requires header `x-qa-e2e-secret` matching env QA_E2E_SECRET.
 * Never enabled on Production (guards + hostname denylist).
 */
export async function POST(req: Request) {
  if (!isQaE2eEnabled()) return disabledResponse();
  try {
    assertRequestHostAllowed(hostFromRequest(req));
  } catch {
    return disabledResponse();
  }

  const provided = readSecret(req);
  const expected = process.env.QA_E2E_SECRET?.trim();
  if (!provided || !expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const owner = await resolveQaOwner();
  if (!owner) {
    return NextResponse.json(
      { ok: false, error: "qa_owner_missing" },
      { status: 503 },
    );
  }

  const token = mintQaE2eToken(owner);
  if (!token) return disabledResponse();

  const res = NextResponse.json({
    ok: true,
    token,
    lineUserId: owner.lineUserId,
    shopSlug: owner.shopSlug,
    role: owner.role,
    barberName: owner.barberName,
  });
  res.cookies.set(QA_E2E_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return res;
}

export async function DELETE(req: Request) {
  if (!isQaE2eEnabled()) return disabledResponse();
  try {
    assertRequestHostAllowed(hostFromRequest(req));
  } catch {
    return disabledResponse();
  }
  const res = NextResponse.json({ ok: true, cleared: true });
  res.cookies.set(QA_E2E_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
