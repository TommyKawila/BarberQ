import {
  countBookableBarberSeats,
  evaluateOverTierAfterSeatChange,
  type OverTierPromptCopy,
} from "@/lib/billing/barber-tier";
import type { Barber, Shop } from "@/types/booking";

export type OverTierWarningPayload = {
  show: true;
  bookableCount: number;
  prompt: OverTierPromptCopy;
};

export function overTierWarningAfterCreate(input: {
  shop: Shop;
  barbersBefore: Barber[];
  created: Barber;
}): OverTierWarningPayload | null {
  const afterList = [...input.barbersBefore, input.created];
  const result = evaluateOverTierAfterSeatChange({
    shop: input.shop,
    barbersBefore: input.barbersBefore,
    bookableCountAfter: countBookableBarberSeats(afterList),
  });
  if (!result.showPrompt || !result.prompt) return null;
  return {
    show: true,
    bookableCount: result.bookableCount,
    prompt: result.prompt,
  };
}

export function overTierWarningAfterBookableOn(input: {
  shop: Shop;
  barbersBefore: Barber[];
  updated: Barber;
}): OverTierWarningPayload | null {
  const afterList = input.barbersBefore.map((b) =>
    b.id === input.updated.id ? input.updated : b,
  );
  const result = evaluateOverTierAfterSeatChange({
    shop: input.shop,
    barbersBefore: input.barbersBefore,
    bookableCountAfter: countBookableBarberSeats(afterList),
  });
  if (!result.showPrompt || !result.prompt) return null;
  return {
    show: true,
    bookableCount: result.bookableCount,
    prompt: result.prompt,
  };
}
