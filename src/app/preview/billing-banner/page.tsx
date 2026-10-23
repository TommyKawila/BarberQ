import { notFound } from "next/navigation";
import { BillingBannerPreview } from "@/app/preview/billing-banner/BillingBannerPreview";
import { arePreviewRoutesEnabled } from "@/lib/preview/preview-routes";

export const dynamic = "force-dynamic";

/** Capture-only: admin billing banner states (amber / red overdue). */
export default async function BillingBannerPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  if (!arePreviewRoutesEnabled()) notFound();
  const { state } = await searchParams;
  const overdue = state === "red" || state === "overdue";
  return <BillingBannerPreview overdue={overdue} graceDaysLeft={overdue ? 4 : 0} />;
}
