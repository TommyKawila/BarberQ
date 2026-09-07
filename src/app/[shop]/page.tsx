import { Suspense } from "react";
import { BookingApp } from "@/components/customer/BookingApp";

export default function ShopBookingPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-zinc-400">Loading…</p>}>
      <BookingApp />
    </Suspense>
  );
}
