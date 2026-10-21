"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";

/** Local / screenshot helper — mounts the friendly error UI. */
export default function SupportErrorPreviewPage() {
  return (
    <AdminRouteError
      error={Object.assign(new Error("Preview error for support screenshots"), {
        digest: "PREVIEW",
      })}
      reset={() => window.location.reload()}
    />
  );
}
