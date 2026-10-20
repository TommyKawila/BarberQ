import type { ShopService } from "@/types/booking";

/** Prompt for a service when the shop has more than one active catalog entry. */
export function shouldPromptServicePicker(
  services: ReadonlyArray<Pick<ShopService, "is_active">>,
): boolean {
  return services.filter((s) => s.is_active).length > 1;
}

export function activeShopServices(
  services: ReadonlyArray<ShopService>,
): ShopService[] {
  return services
    .filter((s) => s.is_active)
    .slice()
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.sort_order - b.sort_order ||
        a.created_at.localeCompare(b.created_at),
    );
}

/** Prefer default; otherwise first active by sort. */
export function defaultActiveService(
  services: ReadonlyArray<ShopService>,
): ShopService | null {
  const active = activeShopServices(services);
  return active.find((s) => s.is_default) ?? active[0] ?? null;
}

/** Confirm CTA: ปิดคิว · ฿200 */
export function closeQueueConfirmLabel(
  template: string,
  priceBaht: number,
): string {
  return template.replace("{price}", String(Math.round(priceBaht)));
}

export function formatServicePriceBaht(priceBaht: number): string {
  return `฿${Math.round(priceBaht)}`;
}
