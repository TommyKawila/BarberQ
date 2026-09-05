const OUTPUT_SIZE = 256;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export class FitLogoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FitLogoError";
  }
}

export function isValidLogoDataUrl(value: string): boolean {
  return value.startsWith("data:image/png;base64,") && value.length <= 300_000;
}

export async function fitLogoFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new FitLogoError("INVALID_TYPE");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new FitLogoError("TOO_LARGE");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new FitLogoError("CANVAS_FAILED");

    const scale = Math.min(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (OUTPUT_SIZE - w) / 2;
    const y = (OUTPUT_SIZE - h) / 2;
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(img, x, y, w, h);

    const dataUrl = canvas.toDataURL("image/png");
    if (!isValidLogoDataUrl(dataUrl)) {
      throw new FitLogoError("OUTPUT_TOO_LARGE");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new FitLogoError("DECODE_FAILED"));
    img.src = src;
  });
}
