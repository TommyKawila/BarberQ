import type { ShopActivation } from "@/lib/onboarding/activation";

export type SupportChecklistItemId =
  | "shop_info"
  | "barbers"
  | "services"
  | "hours"
  | "test_booking";

export interface SupportChecklistItem {
  id: SupportChecklistItemId;
  done: boolean;
  href: string;
}

export interface SupportChecklistProgress {
  items: SupportChecklistItem[];
  completed: number;
  total: number;
  allDone: boolean;
}

/**
 * Today-page onboarding checklist (Round 1): 5 items.
 * Still images per item are UI-only; no videos yet.
 */
export function deriveSupportChecklist(input: {
  activation: ShopActivation;
  servicesOk: boolean;
  adminBasePath?: string;
}): SupportChecklistProgress {
  const base = input.adminBasePath ?? "/admin";
  const items: SupportChecklistItem[] = [
    {
      id: "shop_info",
      done: input.activation.profileOk,
      href: `${base}/settings`,
    },
    {
      id: "barbers",
      done: input.activation.teamOk,
      href: `${base}/staff`,
    },
    {
      id: "services",
      done: input.servicesOk,
      href: `${base}/settings/services`,
    },
    {
      id: "hours",
      done: input.activation.hoursOk,
      href: `${base}/settings`,
    },
    {
      id: "test_booking",
      done: input.activation.hasFirstBooking,
      href: `${base}`,
    },
  ];
  const completed = items.filter((i) => i.done).length;
  return {
    items,
    completed,
    total: items.length,
    allDone: completed === items.length,
  };
}

export const CHECKLIST_STILL_IMAGE: Record<SupportChecklistItemId, string> = {
  shop_info: "/support/checklist/shop-info.svg",
  barbers: "/support/checklist/barbers.svg",
  services: "/support/checklist/services.svg",
  hours: "/support/checklist/hours.svg",
  test_booking: "/support/checklist/test-booking.svg",
};
