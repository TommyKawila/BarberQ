import { redirect } from "next/navigation";
import { demoShopBookingPath } from "@/lib/marketing/demo-shop";

/** Stable ClipperQ Demo booking entry for OA rich menu. */
export default function DemoRedirectPage() {
  redirect(demoShopBookingPath());
}
