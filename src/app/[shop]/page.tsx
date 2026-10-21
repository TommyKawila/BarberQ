import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BookingApp } from "@/components/customer/BookingApp";
import { ShopExpiredBookingMessage } from "@/components/billing/ShopExpiredBookingMessage";
import { computePlanState } from "@/lib/billing/plan-state";
import { getStore } from "@/lib/data";

export default async function ShopBookingPage({
  params,
}: PageProps<"/[shop]">) {
  const { shop: shopSlug } = await params;
  const shop = await getStore().getShopBySlug(shopSlug);
  if (!shop) notFound();

  const plan = computePlanState(shop);
  if (!plan.canBook) {
    return <ShopExpiredBookingMessage shopName={shop.name} />;
  }

  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-zinc-400">Loading…</p>}>
      <BookingApp />
    </Suspense>
  );
}
