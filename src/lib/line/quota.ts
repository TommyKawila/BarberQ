import {
  getMessageQuota,
  getMessageQuotaConsumption,
} from "@/lib/line/messaging-api";
import { countCountedPushesThisMonth } from "@/lib/line/message-log";
import {
  getShopLineChannel,
  getShopLineChannelSecrets,
  type LineChannelPlan,
} from "@/lib/line/shop-channel";

export type QuotaLevel = "ok" | "warn" | "full";

export interface ShopPushQuota {
  used: number;
  budget: number;
  remaining: number;
  level: QuotaLevel;
  percent: number;
  plan: LineChannelPlan;
  source: "local" | "line_api" | "merged";
  resetAt: string;
  canPush: boolean;
  lineApiUsage: number | null;
  lineApiLimit: number | null;
}

function nextMonthResetIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export function classifyQuota(used: number, budget: number): QuotaLevel {
  if (used >= budget) return "full";
  if (used / budget >= 0.8) return "warn";
  return "ok";
}

export async function getShopPushQuota(shopId: string): Promise<ShopPushQuota> {
  const channel = await getShopLineChannel(shopId);
  const budget = channel?.monthlyPushBudget ?? 300;
  const plan = channel?.plan ?? "free";
  const localUsed = await countCountedPushesThisMonth(shopId);

  let lineApiUsage: number | null = null;
  let lineApiLimit: number | null = null;
  let source: ShopPushQuota["source"] = "local";

  const secrets = await getShopLineChannelSecrets(shopId);
  if (secrets.accessToken) {
    try {
      const [quota, consumption] = await Promise.all([
        getMessageQuota(secrets.accessToken),
        getMessageQuotaConsumption(secrets.accessToken),
      ]);
      lineApiUsage = consumption.totalUsage;
      if (quota.type === "limited" && typeof quota.value === "number") {
        lineApiLimit = quota.value;
      }
      source = "line_api";
    } catch {
      source = "local";
    }
  }

  const used =
    lineApiUsage != null ? Math.max(localUsed, lineApiUsage) : localUsed;
  const effectiveBudget = lineApiLimit != null ? lineApiLimit : budget;
  if (lineApiUsage != null && localUsed !== lineApiUsage) source = "merged";

  const level = classifyQuota(used, effectiveBudget);
  return {
    used,
    budget: effectiveBudget,
    remaining: Math.max(0, effectiveBudget - used),
    level,
    percent: Math.min(100, Math.round((used / effectiveBudget) * 100)),
    plan,
    source,
    resetAt: nextMonthResetIso(),
    canPush: used < effectiveBudget,
    lineApiUsage,
    lineApiLimit,
  };
}

export async function assertCanPush(shopId: string): Promise<ShopPushQuota> {
  const quota = await getShopPushQuota(shopId);
  return quota;
}
