import { createServiceClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";
import { isPrototypeMode } from "@/lib/data";
import {
  coverImageExtension,
  validateCoverImageBuffer,
} from "@/lib/image/validate-cover-image";

export const SHOP_COVERS_BUCKET = "shop-covers";

export async function uploadShopCoverImage(
  shopId: string,
  buffer: ArrayBuffer,
  contentType: string | null,
): Promise<string> {
  const validatedType = validateCoverImageBuffer(buffer, contentType);

  if (isPrototypeMode()) {
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${validatedType};base64,${base64}`;
  }

  const ext = coverImageExtension(validatedType);
  const path = `${shopId}/cover-${Date.now()}.${ext}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(SHOP_COVERS_BUCKET).upload(path, buffer, {
    contentType: validatedType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const base = getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${SHOP_COVERS_BUCKET}/${path}`;
}

export async function deleteShopCoverImage(
  coverImageUrl: string | null | undefined,
): Promise<void> {
  if (!coverImageUrl) return;

  if (isPrototypeMode() || coverImageUrl.startsWith("data:")) {
    return;
  }

  const marker = `/storage/v1/object/public/${SHOP_COVERS_BUCKET}/`;
  const idx = coverImageUrl.indexOf(marker);
  if (idx === -1) return;
  const path = coverImageUrl.slice(idx + marker.length);
  const supabase = createServiceClient();
  await supabase.storage.from(SHOP_COVERS_BUCKET).remove([path]);
}
