import { Suspense } from "react";
import { PlatformTopBar } from "@/components/layout/PlatformTopBar";
import BarberLineJoinPage from "./page.client";

export default function BarberLineJoinWrapper() {
  return (
    <>
      <PlatformTopBar />
      <Suspense
        fallback={
          <section className="flex min-h-[50vh] items-center justify-center px-4 py-10">
            <p className="text-sm text-zinc-400">…</p>
          </section>
        }
      >
        <BarberLineJoinPage />
      </Suspense>
    </>
  );
}
