import { getStore, StoreConflict } from "@/lib/data";
import {
  formatTrialStartedMessage,
  notifyOperator,
} from "@/lib/billing/operator-notify";
import type { Shop } from "@/types/booking";

export const SELF_SERVE_TRIAL_DAYS = 30;

export class TrialAbuseError extends Error {
  constructor(
    message: string,
    readonly code: "ALREADY_HAS_SHOP" | "RATE_LIMIT" | "INVALID_NAME",
  ) {
    super(message);
    this.name = "TrialAbuseError";
  }
}

export async function startSelfServeTrial(input: {
  shopName: string;
  ownerLineId: string;
  ownerName: string;
  province?: string | null;
  barberCount?: number | null;
  locale?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
}): Promise<{ shop: Shop; leadId: string }> {
  const name = input.shopName.trim();
  if (!name) throw new TrialAbuseError("Shop name required", "INVALID_NAME");

  const store = getStore();
  const existing = await store.getBarberByLineId(input.ownerLineId);
  if (existing) {
    throw new TrialAbuseError("LINE user already has a shop role", "ALREADY_HAS_SHOP");
  }

  let shop: Shop;
  try {
    shop = await store.createShop({
      name,
      ownerLineId: input.ownerLineId,
      ownerName: input.ownerName || "Owner",
      subscriptionDays: SELF_SERVE_TRIAL_DAYS,
      status: "trialing",
    });
  } catch (err) {
    if (err instanceof StoreConflict && err.code === "LINE_ID_TAKEN") {
      throw new TrialAbuseError("LINE user already has a shop role", "ALREADY_HAS_SHOP");
    }
    throw err;
  }

  const lead = await store.createTrialLead({
    shopName: name,
    contactName: input.ownerName || "Owner",
    contactValue: `line:${input.ownerLineId}`,
    province: input.province ?? null,
    barberCount: input.barberCount ?? null,
    locale: input.locale ?? null,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    referrer: input.referrer ?? "self-serve-trial",
  });

  await store.updateTrialLead(lead.id, {
    status: "CONVERTED",
    shopId: shop.id,
  });

  void notifyOperator(
    "trial_started",
    formatTrialStartedMessage({
      shopName: shop.name,
      shopSlug: shop.slug,
      ownerLineId: input.ownerLineId,
      subscribedUntil: shop.subscribed_until,
    }),
  );

  return { shop, leadId: lead.id };
}
