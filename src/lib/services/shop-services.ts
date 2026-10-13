import { getStore } from "@/lib/data";
import type { CreateShopServiceInput, UpdateShopServiceInput } from "@/lib/data/types";
import { BookingError } from "@/lib/services/booking-service";
import type { ShopService } from "@/types/booking";

function mapStoreError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (code === "INVALID_PRICE") throw new BookingError("INVALID_PRICE", "Invalid price", 400);
    if (code === "SERVICE_NOT_FOUND") throw new BookingError("SERVICE_NOT_FOUND", "Service not found", 404);
    if (code === "NOT_FOUND") throw new BookingError("NOT_FOUND", "Not found", 404);
  }
  throw error instanceof Error ? error : new Error(String(error));
}

export async function listShopServices(
  shopId: string,
  opts?: { includeInactive?: boolean },
): Promise<ShopService[]> {
  return getStore().listShopServices(shopId, opts);
}

export async function createShopService(input: CreateShopServiceInput): Promise<ShopService> {
  try {
    return await getStore().createShopService(input);
  } catch (error) {
    mapStoreError(error);
  }
}

export async function updateShopService(
  serviceId: string,
  shopId: string,
  input: UpdateShopServiceInput,
): Promise<ShopService> {
  try {
    return await getStore().updateShopService(serviceId, shopId, input);
  } catch (error) {
    mapStoreError(error);
  }
}
