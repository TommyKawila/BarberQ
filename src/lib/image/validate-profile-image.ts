const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export class ProfileImageError extends Error {
  constructor(public readonly code: "INVALID_TYPE" | "TOO_LARGE" | "EMPTY") {
    super(code);
    this.name = "ProfileImageError";
  }
}

export function validateProfileImageBuffer(
  buffer: ArrayBuffer,
  contentType: string | null,
): void {
  if (!buffer.byteLength) throw new ProfileImageError("EMPTY");
  if (buffer.byteLength > MAX_BYTES) throw new ProfileImageError("TOO_LARGE");
  const type = contentType?.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_TYPES.has(type)) throw new ProfileImageError("INVALID_TYPE");
}

export function profileImageExtension(contentType: string | null): string {
  const type = contentType?.split(";")[0]?.trim() ?? "";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}
