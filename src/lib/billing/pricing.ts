export type PlanTier = "1-2" | "3-5" | "6-10" | "contact";

export interface PlanPrice {
  tier: PlanTier;
  amountBaht: number | null;
  labelTh: string;
  labelEn: string;
}

export function priceForBarberCount(barberCount: number): PlanPrice {
  const n = Math.max(0, Math.floor(barberCount));
  if (n <= 2) {
    return {
      tier: "1-2",
      amountBaht: 399,
      labelTh: "1–2 ช่าง · ฿399/เดือน",
      labelEn: "1–2 barbers · ฿399/mo",
    };
  }
  if (n <= 5) {
    return {
      tier: "3-5",
      amountBaht: 599,
      labelTh: "3–5 ช่าง · ฿599/เดือน",
      labelEn: "3–5 barbers · ฿599/mo",
    };
  }
  if (n <= 10) {
    return {
      tier: "6-10",
      amountBaht: 999,
      labelTh: "6–10 ช่าง · ฿999/เดือน",
      labelEn: "6–10 barbers · ฿999/mo",
    };
  }
  return {
    tier: "contact",
    amountBaht: null,
    labelTh: "มากกว่า 10 ช่าง · ติดต่อเรา",
    labelEn: "More than 10 barbers · contact us",
  };
}

export const PLAN_PRICE_TABLE: PlanPrice[] = [
  priceForBarberCount(1),
  priceForBarberCount(3),
  priceForBarberCount(6),
  priceForBarberCount(11),
];
