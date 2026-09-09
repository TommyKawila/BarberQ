import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import {
  isOpenLineOaInstallStatus,
  validateLineOaInstallPayload,
} from "@/lib/onboarding/line-oa-install";
import { resolveShopParam } from "@/lib/shop/api-route";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function mapValidationError(err: unknown): never {
  if (err instanceof Error) {
    const code = err.message;
    if (
      code === "INVALID_LINE_OA" ||
      code === "INVALID_RICH_MENU_STATE" ||
      code === "INVALID_HELP_TYPE" ||
      code === "INVALID_CONTACT_PHONE" ||
      code === "INVALID_CREDENTIAL_FIELD"
    ) {
      throw new BookingError("INVALID_INPUT", code, 400);
    }
  }
  throw err;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const request = await getStore().getLatestLineOaInstallRequest(shop.id);
    return NextResponse.json({ request });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const body = await readJson<Record<string, unknown>>(req);
    let input;
    try {
      input = validateLineOaInstallPayload(body);
    } catch (err) {
      mapValidationError(err);
    }

    const store = getStore();
    const latest = await store.getLatestLineOaInstallRequest(shop.id);
    if (latest && isOpenLineOaInstallStatus(latest.status)) {
      return NextResponse.json({ request: latest, existing: true });
    }

    const request = await store.createLineOaInstallRequest(shop.id, input);
    return NextResponse.json({ request, existing: false }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
