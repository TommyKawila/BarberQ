import { Suspense } from "react";
import OwnerJoinPage from "./page.client";

export default function OwnerJoinWrapper() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[50vh] items-center justify-center px-4 py-10">
          <p className="text-sm text-zinc-400">…</p>
        </section>
      }
    >
      <OwnerJoinPage />
    </Suspense>
  );
}
