import type { Metadata } from "next";
import { BookingSuccessPreview } from "./BookingSuccessPreview";

export const metadata: Metadata = {
  title: "Booking success preview · ClipperQ",
  description: "Standalone Thai booking-success screen mock for review (demo data only).",
  robots: { index: false, follow: false },
};

/** Review-only route — demo data, no booking side effects. */
export default function BookingSuccessPreviewPage() {
  return <BookingSuccessPreview />;
}
