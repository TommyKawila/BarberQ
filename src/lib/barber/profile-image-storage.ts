import { createServiceClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";
import { isPrototypeMode } from "@/lib/data";
import {
  profileImageExtension,
  validateProfileImageBuffer,
} from "@/lib/image/validate-profile-image";

const BUCKET = "barber-profiles";

export async function uploadBarberProfileImage(
  shopId: string,
  barberId: string,
  buffer: ArrayBuffer,
  contentType: string | null,
): Promise<string> {
  validateProfileImageBuffer(buffer, contentType);

  if (isPrototypeMode()) {
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType?.split(";")[0]?.trim() || "image/png";
    return `data:${mime};base64,${base64}`;
  }

  const ext = profileImageExtension(contentType);
  const path = `${shopId}/${barberId}.${ext}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType?.split(";")[0]?.trim() || "image/png",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const base = getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteBarberProfileImage(
  shopId: string,
  barberId: string,
  profileImageUrl: string | null | undefined,
): Promise<void> {
  if (!profileImageUrl) return;

  if (isPrototypeMode() || profileImageUrl.startsWith("data:")) {
    return;
  }

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = profileImageUrl.indexOf(marker);
  if (idx === -1) return;
  const path = profileImageUrl.slice(idx + marker.length);
  const supabase = createServiceClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
