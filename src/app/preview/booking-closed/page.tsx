import { notFound } from "next/navigation";
import { BookingClosedPreview } from "@/app/preview/booking-closed/BookingClosedPreview";
import { arePreviewRoutesEnabled } from "@/lib/preview/preview-routes";

export const dynamic = "force-dynamic";

/** Capture-only: customer booking page after billing grace. */
export default function BookingClosedPreviewPage() {
  if (!arePreviewRoutesEnabled()) notFound();
  return <BookingClosedPreview />;
}
