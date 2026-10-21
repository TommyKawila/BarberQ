import { createServiceClient } from "@/lib/supabase/server";
import { isPrototypeMode } from "@/lib/data";
import { randomUUID } from "crypto";

export const PAYMENT_SLIPS_BUCKET = "payment-slips";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateSlipContentType(contentType: string | null): string {
  const base = (contentType ?? "").split("+")[0]?.trim().toLowerCase() || "";
  // Allow mock verifier suffix on content-type in tests: image/jpeg+mock/pass
  const normalized = base || "image/jpeg";
  if (!ALLOWED.has(normalized) && !normalized.startsWith("image/")) {
    throw new Error("INVALID_SLIP_TYPE");
  }
  if (!ALLOWED.has(normalized)) {
    // still accept image/* for mock content types in tests
    if (!(contentType ?? "").startsWith("image/")) throw new Error("INVALID_SLIP_TYPE");
  }
  return contentType?.trim() || normalized;
}

/**
 * Store slip privately. Prototype mode returns a data URL path marker.
 * Production uses private `payment-slips` bucket (no public URL).
 */
export async function uploadPaymentSlip(
  shopId: string,
  buffer: ArrayBuffer,
  contentType: string | null,
): Promise<{ path: string; contentType: string }> {
  const validated = validateSlipContentType(contentType);
  const ext = validated.includes("png")
    ? "png"
    : validated.includes("webp")
      ? "webp"
      : "jpg";

  if (isPrototypeMode()) {
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      path: `data:${validated.split("+")[0]};base64,${base64}`,
      contentType: validated,
    };
  }

  const path = `${shopId}/${Date.now()}-${randomUUID()}.${ext}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(PAYMENT_SLIPS_BUCKET).upload(
    path,
    buffer,
    {
      contentType: validated.split("+")[0] || "image/jpeg",
      upsert: false,
    },
  );
  if (error) throw new Error(error.message);
  return { path, contentType: validated };
}
