import { notFound } from "next/navigation";
import { BillingPeriodPreview } from "@/app/preview/billing-period/BillingPeriodPreview";
import { arePreviewRoutesEnabled } from "@/lib/preview/preview-routes";

export const dynamic = "force-dynamic";

/** Capture-only: monthly / yearly billing toggle states. */
export default async function BillingPeriodPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  if (!arePreviewRoutesEnabled()) notFound();
  const { period } = await searchParams;
  return (
    <BillingPeriodPreview period={period === "yearly" ? "yearly" : "monthly"} />
  );
}
