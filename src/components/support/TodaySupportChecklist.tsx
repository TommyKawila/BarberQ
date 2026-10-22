"use client";

import { useCallback, useEffect, useState } from "react";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { resolveClipperqSupportLineUrl } from "@/lib/marketing/clipperq-oa";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { deriveSupportChecklist } from "@/lib/support/checklist";
import type { ShopActivation } from "@/lib/onboarding/activation";
import { OnboardingChecklistCard } from "@/components/support/OnboardingChecklistCard";

interface SetupPayload {
  activation?: ShopActivation;
  servicesCount?: number;
}

/**
 * Loads setup activation + services count, renders Today checklist,
 * and "ask team" creates setup_help ticket then opens ClipperQ OA LINE.
 */
export function TodaySupportChecklist() {
  const { shopApi, shopPath } = useShopSlug();
  const [activation, setActivation] = useState<ShopActivation | null>(null);
  const [servicesOk, setServicesOk] = useState(false);
  const [asking, setAsking] = useState(false);

  const load = useCallback(async () => {
    try {
      const headers = await getLineAuthHeaders();
      const res = await fetch(shopApi("/setup"), { headers });
      if (!res.ok) return;
      const json = (await res.json()) as SetupPayload & {
        shop?: { services?: unknown[] };
      };
      if (json.activation) setActivation(json.activation);

      // Prefer dedicated services list when available
      const svcRes = await fetch(shopApi("/services"), { headers });
      if (svcRes.ok) {
        const svcJson = (await svcRes.json()) as { services?: unknown[] };
        setServicesOk((svcJson.services?.length ?? 0) > 0);
      } else if (typeof json.servicesCount === "number") {
        setServicesOk(json.servicesCount > 0);
      }
    } catch {
      // Checklist is best-effort on Today
    }
  }, [shopApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const askTeam = useCallback(async () => {
    setAsking(true);
    try {
      const headers = await getLineAuthHeaders();
      await fetch(shopApi("/support/tickets"), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "setup_help",
          body: "ขอให้ทีมช่วยตั้งค่าร้าน",
          pagePath: typeof window !== "undefined" ? window.location.pathname : "",
          deviceInfo:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
        }),
      });
    } catch {
      // Still open LINE even if ticket create fails offline
    } finally {
      setAsking(false);
      window.open(resolveClipperqSupportLineUrl(), "_blank", "noopener,noreferrer");
    }
  }, [shopApi]);

  if (!activation) return null;

  const progress = deriveSupportChecklist({
    activation,
    servicesOk,
    adminBasePath: shopPath("/admin"),
  });

  return (
    <OnboardingChecklistCard
      progress={progress}
      onAskTeam={() => void askTeam()}
      asking={asking}
    />
  );
}
