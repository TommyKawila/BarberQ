import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import type { Barber, Shop } from "@/types/booking";

export interface ShopActivationInput {
  shopStatus: Shop["status"];
  shopName: string | null;
  hours: ShopHours | null;
  barbers: Barber[];
  appointmentCount: number;
}

export interface ShopActivation {
  claimed: boolean;
  profileOk: boolean;
  teamOk: boolean;
  hoursOk: boolean;
  hasFirstBooking: boolean;
  ready: boolean;
  bookableCount: number;
  completedSteps: number;
  totalSteps: number;
}

export function deriveShopActivation(input: ShopActivationInput): ShopActivation {
  const claimed = input.shopStatus === "active";
  const profileOk = Boolean(input.shopName?.trim());
  const bookableCount = input.barbers.filter((b) => b.is_bookable !== false).length;
  const teamOk = bookableCount >= 1;
  const normalized = normalizeShopHours(input.hours);
  const hoursOk = normalized.some((day) => !day.closed);
  const hasFirstBooking = input.appointmentCount > 0;
  const ready = claimed && teamOk && hoursOk;

  const setupSteps = [profileOk, teamOk, hoursOk];
  const completedSteps = setupSteps.filter(Boolean).length;

  return {
    claimed,
    profileOk,
    teamOk,
    hoursOk,
    hasFirstBooking,
    ready,
    bookableCount,
    completedSteps,
    totalSteps: 3,
  };
}

export function firstIncompleteSetupStep(
  activation: ShopActivation,
): "profile" | "team" | "hours" | "link" | "test" | "ready" {
  if (!activation.profileOk) return "profile";
  if (!activation.teamOk) return "team";
  if (!activation.hoursOk) return "hours";
  if (!activation.ready) return "link";
  if (!activation.hasFirstBooking) return "test";
  return "ready";
}
