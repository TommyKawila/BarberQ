"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";

export default function ShopAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminRouteError error={error} reset={reset} />;
}
