export interface ShopDayHours {
  closed: boolean;
  open: string;
  close: string;
}

export type ShopHours = ShopDayHours[];

/** Sunday=0 … Saturday=6 — matches PHINX legacy hardcode */
export const DEFAULT_SHOP_HOURS: ShopHours = [
  { closed: false, open: "10:00", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:00", close: "20:00" },
];

export function normalizeShopHours(raw: ShopHours | null | undefined): ShopHours {
  if (!raw || raw.length !== 7) return DEFAULT_SHOP_HOURS.map((d) => ({ ...d }));
  return raw.map((day) => ({
    closed: Boolean(day.closed),
    open: day.open ?? "10:00",
    close: day.close ?? "20:00",
  }));
}
