import { assertProductionConfig, isProductionRuntime } from "@/lib/env";

export function assertSuperAdminToken(token: string | null): void {
  if (isProductionRuntime()) {
    assertProductionConfig();
    const expected = process.env.SUPERADMIN_TOKEN?.trim();
    if (!expected || token !== expected) {
      throw new Error("Unauthorized");
    }
    return;
  }

  const expected = process.env.SUPERADMIN_TOKEN?.trim();
  if (!expected || token !== expected) {
    throw new Error("Unauthorized");
  }
}
