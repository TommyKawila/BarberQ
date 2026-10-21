import { randomUUID } from "crypto";
import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";

export const SUPPORT_SCREENSHOTS_BUCKET = "support-screenshots";
export const MAX_SUPPORT_SCREENSHOTS = 3;
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateScreenshotContentType(contentType: string | null): string {
  const base = (contentType ?? "").split(";")[0]?.trim().toLowerCase() || "";
  if (!ALLOWED.has(base)) {
    throw new Error("INVALID_SCREENSHOT_TYPE");
  }
  return base;
}

export function assertScreenshotSize(byteLength: number): void {
  if (byteLength <= 0 || byteLength > MAX_BYTES) {
    throw new Error("INVALID_SCREENSHOT_SIZE");
  }
}

/**
 * Store support screenshots privately.
 * Prototype mode returns a data-URL marker (not uploaded).
 */
export async function uploadSupportScreenshot(
  shopId: string,
  buffer: ArrayBuffer,
  contentType: string | null,
): Promise<{ path: string; contentType: string }> {
  const validated = validateScreenshotContentType(contentType);
  assertScreenshotSize(buffer.byteLength);
  const ext = validated.includes("png")
    ? "png"
    : validated.includes("webp")
      ? "webp"
      : "jpg";

  if (isPrototypeMode()) {
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      path: `data:${validated};base64,${base64}`,
      contentType: validated,
    };
  }

  const path = `${shopId}/${Date.now()}-${randomUUID()}.${ext}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(SUPPORT_SCREENSHOTS_BUCKET)
    .upload(path, buffer, {
      contentType: validated,
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return { path, contentType: validated };
}
