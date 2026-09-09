import type { ShopDayHours } from "@/lib/shop/shop-hours";

export const HOURS_PRESET_MON_FRI = [1, 2, 3, 4, 5];
export const HOURS_PRESET_MON_SAT = [1, 2, 3, 4, 5, 6];
export const HOURS_PRESET_ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_TEMPLATE_OPEN = "10:00";
export const DEFAULT_TEMPLATE_CLOSE = "19:00";

export function applyDefaultHoursToSelectedDays(
  hours: ShopDayHours[],
  selectedDays: number[],
  open: string,
  close: string,
): ShopDayHours[] {
  const selected = new Set(selectedDays);
  return hours.map((row, index) =>
    selected.has(index) ? { ...row, closed: false, open, close } : row,
  );
}

export function formatHoursRange(open: string, close: string): string {
  return `${open} – ${close}`;
}
