import { createServiceClient } from "@/lib/supabase/server";
import { isPrototypeMode } from "@/lib/data";
import { PAYMENT_SLIPS_BUCKET } from "@/lib/billing/payment-slips";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function validateSlipImage(
  buffer: ArrayBuffer,
  contentType: string | null,
): string {
  const type = (contentType ?? "").split(";")[0]?.trim().toLowerCase() || "";
  if (!ALLOWED.has(type)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }
  if (buffer.byteLength < 32 || buffer.byteLength > MAX_BYTES) {
    throw new Error("INVALID_IMAGE_SIZE");
  }
  return type;
}

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Upload slip to private bucket. In prototype mode returns a data: path marker
 * (bytes kept in storage_path as data URL for local review).
 */
export async function uploadPaymentSlipImage(
  shopId: string,
  buffer: ArrayBuffer,
  contentType: string | null,
): Promise<{ path: string; contentType: string }> {
  const validated = validateSlipImage(buffer, contentType);

  if (isPrototypeMode()) {
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      path: `data:${validated};base64,${base64}`,
      contentType: validated,
    };
  }

  const path = `${shopId}/${Date.now()}.${extFor(validated)}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(PAYMENT_SLIPS_BUCKET)
    .upload(path, buffer, { contentType: validated, upsert: false });
  if (error) throw new Error(error.message);
  return { path, contentType: validated };
}

export async function createPaymentSlipSignedUrl(
  storagePath: string,
  expiresSec = 120,
): Promise<string | null> {
  if (storagePath.startsWith("data:")) return storagePath;
  if (isPrototypeMode()) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(PAYMENT_SLIPS_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
