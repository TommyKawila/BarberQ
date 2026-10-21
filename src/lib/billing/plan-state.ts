import type { Shop } from "@/types/booking";

export const SUBSCRIPTION_GRACE_DAYS = 3;

export type PlanState = "trialing" | "active" | "grace" | "expired";

export interface PlanSnapshot {
  state: PlanState;
  subscribedUntil: string | null;
  graceEndsAt: string | null;
  daysRemaining: number | null;
  canBook: boolean;
  canUseAdmin: boolean;
  isDemo: boolean;
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Whole calendar days from `now` until `until` (negative if past). */
export function calendarDaysUntil(until: Date, now: Date = new Date()): number {
  return Math.round((startOfUtcDay(until) - startOfUtcDay(now)) / 86_400_000);
}

export function computePlanState(
  shop: Pick<Shop, "status" | "subscribed_until" | "is_demo">,
  now: Date = new Date(),
): PlanSnapshot {
  const isDemo = Boolean(shop.is_demo);
  if (isDemo) {
    return {
      state: "active",
      subscribedUntil: shop.subscribed_until,
      graceEndsAt: null,
      daysRemaining: null,
      canBook: true,
      canUseAdmin: true,
      isDemo: true,
    };
  }

  if (shop.status === "suspended" || shop.status === "cancelled") {
    return {
      state: "expired",
      subscribedUntil: shop.subscribed_until,
      graceEndsAt: null,
      daysRemaining: null,
      canBook: false,
      canUseAdmin: false,
      isDemo: false,
    };
  }

  if (!shop.subscribed_until) {
    // Legacy / seed shops without a clock stay usable.
    const state: PlanState = shop.status === "trialing" ? "trialing" : "active";
    return {
      state,
      subscribedUntil: null,
      graceEndsAt: null,
      daysRemaining: null,
      canBook: true,
      canUseAdmin: true,
      isDemo: false,
    };
  }

  const until = new Date(shop.subscribed_until);
  const graceEnds = new Date(until.getTime() + SUBSCRIPTION_GRACE_DAYS * 86_400_000);
  const daysRemaining = calendarDaysUntil(until, now);

  if (now.getTime() <= until.getTime()) {
    const state: PlanState = shop.status === "trialing" ? "trialing" : "active";
    return {
      state,
      subscribedUntil: shop.subscribed_until,
      graceEndsAt: graceEnds.toISOString(),
      daysRemaining,
      canBook: true,
      canUseAdmin: true,
      isDemo: false,
    };
  }

  if (now.getTime() <= graceEnds.getTime()) {
    return {
      state: "grace",
      subscribedUntil: shop.subscribed_until,
      graceEndsAt: graceEnds.toISOString(),
      daysRemaining,
      canBook: true,
      canUseAdmin: true,
      isDemo: false,
    };
  }

  return {
    state: "expired",
    subscribedUntil: shop.subscribed_until,
    graceEndsAt: graceEnds.toISOString(),
    daysRemaining,
    canBook: false,
    canUseAdmin: false,
    isDemo: false,
  };
}

export function isShopOperationalStatus(status: Shop["status"]): boolean {
  return status === "active" || status === "trialing";
}
