const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export class CoverImageError extends Error {
  constructor(public readonly code: "INVALID_TYPE" | "TOO_LARGE" | "EMPTY") {
    super(code);
    this.name = "CoverImageError";
  }
}

function detectImageType(buffer: ArrayBuffer): "image/png" | "image/jpeg" | "image/webp" | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function coverImageExtension(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

export function validateCoverImageBuffer(buffer: ArrayBuffer, contentType: string | null): string {
  if (!buffer.byteLength) throw new CoverImageError("EMPTY");
  if (buffer.byteLength > MAX_BYTES) throw new CoverImageError("TOO_LARGE");

  const detected = detectImageType(buffer);
  if (!detected) throw new CoverImageError("INVALID_TYPE");

  const declared = contentType?.split(";")[0]?.trim() ?? "";
  if (declared && ALLOWED_TYPES.has(declared) && declared !== detected) {
    throw new CoverImageError("INVALID_TYPE");
  }

  return detected;
}
