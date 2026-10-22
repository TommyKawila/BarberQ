import type { Metadata } from "next";
import { HeroBookingPreview } from "./HeroBookingPreview";

export const metadata: Metadata = {
  title: "Hero booking preview · ClipperQ",
  description: "Capture-only booking UI with demo selections (no personal data).",
  robots: { index: false, follow: false },
};

/** Review/capture-only — real booking components, sample props, no side effects. */
export default function HeroBookingPreviewPage() {
  return <HeroBookingPreview />;
}
