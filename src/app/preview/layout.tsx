import { notFound } from "next/navigation";
import { arePreviewRoutesEnabled } from "@/lib/preview/preview-routes";

/**
 * Server gate for all `/preview/*` capture routes.
 * Production → 404; local + barberq-qa (founder_qa) → render.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (!arePreviewRoutesEnabled()) {
    notFound();
  }
  return children;
}
