import { memoryStore } from "@/lib/data/memory-store";
import { supabaseStore } from "@/lib/data/supabase-store";
import type { BookingStore } from "@/lib/data/types";
import { getOptionalEnv } from "@/lib/env";

export { StoreConflict } from "@/lib/data/types";
export type { BookingStore, StoreErrorCode } from "@/lib/data/types";
export { BARBER_SEED } from "@/lib/data/seed";

export function isPrototypeMode(): boolean {
  return !(
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function getStore(): BookingStore {
  if (isPrototypeMode()) return memoryStore;
  return supabaseStore;
}
