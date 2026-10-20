import { redirect } from "next/navigation";
import { DemoUnavailable } from "@/components/demo/DemoUnavailable";
import { findDemoShop } from "@/lib/demo/demo-shop-guards";
import { demoShopBookingPath } from "@/lib/marketing/demo-shop";

export const dynamic = "force-dynamic";

/** Stable ClipperQ Demo booking entry for OA rich menu. */
export default async function DemoRedirectPage() {
  const shop = await findDemoShop();
  if (!shop) {
    return <DemoUnavailable variant="booking" />;
  }
  redirect(demoShopBookingPath());
}
