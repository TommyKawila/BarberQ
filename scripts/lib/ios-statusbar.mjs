import sharp from "sharp";

/**
 * Logical iOS top safe-area height (pt) when island metrics are unknown.
 * Clears Dynamic Island (~37–44px) + room for BrandMark / shop name.
 */
export const STATUS_BAR_PT = 74;

/** Render icon SVG at a high fixed pixel size, then downscale with lanczos for crisp edges. */
const ICON_RENDER_SCALE = 8; // 8× viewBox → sharp downsample into status bar

function cellularIconSvg() {
  const w = 19 * ICON_RENDER_SCALE;
  const h = 12 * ICON_RENDER_SCALE;
  // Classic iOS cellular: 4 bars — filled shapes only (no stroke aliasing)
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 19 12">
  <rect x="0.5" y="8" width="3" height="4" rx="0.55" fill="#fafafa"/>
  <rect x="5.5" y="5.5" width="3" height="6.5" rx="0.55" fill="#fafafa"/>
  <rect x="10.5" y="3" width="3" height="9" rx="0.55" fill="#fafafa"/>
  <rect x="15.5" y="0.5" width="3" height="11.5" rx="0.55" fill="#fafafa"/>
</svg>`);
}

function wifiIconSvg() {
  const w = 16 * ICON_RENDER_SCALE;
  const h = 12 * ICON_RENDER_SCALE;
  // Filled ring-arc wedges via thick strokes in a fixed viewBox (uniform scale only)
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 16 12">
  <g fill="none" stroke="#fafafa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.2 4.4c3.2-2.9 8.4-2.9 11.6 0"/>
    <path d="M4.2 6.5c2.1-1.9 5.5-1.9 7.6 0"/>
    <path d="M6.2 8.5c1-0.9 2.6-0.9 3.6 0"/>
  </g>
  <circle cx="8" cy="10.55" r="1.2" fill="#fafafa"/>
</svg>`);
}

function batteryIconSvg() {
  const w = 27 * ICON_RENDER_SCALE;
  const h = 12 * ICON_RENDER_SCALE;
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 27 12">
  <rect x="0.9" y="1.4" width="22.2" height="9.2" rx="2.1" ry="2.1"
    fill="none" stroke="#fafafa" stroke-width="1.4"/>
  <rect x="2.6" y="3.05" width="14.8" height="5.9" rx="1" fill="#fafafa"/>
  <rect x="24.1" y="3.9" width="2.1" height="4.2" rx="0.7" fill="#fafafa"/>
</svg>`);
}

/**
 * Build a dark-mode iOS status bar: time left, crisp icons right.
 * Icons are rendered from fixed viewBox SVGs (3×) then composited — no stretching.
 */
export async function statusBarPng(width, height) {
  const scale = width / 390;
  const timeX = Math.round(28 * scale);
  const timeY = Math.round(Math.min(height * 0.58, 36 * scale));
  const fontSize = Math.round(15 * scale);

  // Icon display height ~12pt → pixels
  const iconH = Math.max(12, Math.round(12 * scale));
  const iconY = Math.round((height - iconH) / 2);

  const [cellBuf, wifiBuf, battBuf] = await Promise.all([
    sharp(cellularIconSvg())
      .resize({ height: iconH, fit: "inside", kernel: "lanczos3" })
      .png()
      .toBuffer({ resolveWithObject: true }),
    sharp(wifiIconSvg())
      .resize({ height: iconH, fit: "inside", kernel: "lanczos3" })
      .png()
      .toBuffer({ resolveWithObject: true }),
    sharp(batteryIconSvg())
      .resize({ height: iconH, fit: "inside", kernel: "lanczos3" })
      .png()
      .toBuffer({ resolveWithObject: true }),
  ]);

  const gap = Math.round(6 * scale);
  const rightPad = Math.round(14 * scale);
  const battW = battBuf.info.width;
  const wifiW = wifiBuf.info.width;
  const cellW = cellBuf.info.width;
  const battX = width - rightPad - battW;
  const wifiX = battX - gap - wifiW;
  const cellX = wifiX - gap - cellW;

  const timeSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#09090b"/>
  <text x="${timeX}" y="${timeY}" fill="#fafafa" font-size="${fontSize}" font-weight="600"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif">9:41</text>
</svg>`);

  return sharp(timeSvg)
    .png()
    .composite([
      { input: cellBuf.data, left: cellX, top: iconY },
      { input: wifiBuf.data, left: wifiX, top: iconY },
      { input: battBuf.data, left: battX, top: iconY },
    ])
    .png()
    .toBuffer();
}

/** @deprecated use statusBarPng — kept for callers expecting SVG buffer */
export function statusBarSvg(width, height) {
  // Fallback simple SVG if something still imports this; prefer statusBarPng.
  const scale = height / 54;
  const timeX = Math.round(28 * scale);
  const timeY = Math.round(Math.min(height * 0.62, 34 * scale));
  const fontSize = Math.round(15 * scale);
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#09090b"/>
  <text x="${timeX}" y="${timeY}" fill="#fafafa" font-size="${fontSize}" font-weight="600"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif">9:41</text>
</svg>`);
}

/**
 * Place an iOS status bar above app content, keeping the same canvas size.
 * Content is cover-fit into the area below the status bar (top-aligned).
 *
 * @param {string|Buffer} inputPathOrBuffer
 * @param {{ width?: number, height?: number, statusBarPt?: number }} [opts]
 */
export async function withStatusBar(inputPathOrBuffer, opts = {}) {
  const meta = await sharp(inputPathOrBuffer).metadata();
  const w = opts.width ?? meta.width;
  const h = opts.height ?? meta.height;
  if (!w || !h) throw new Error("Could not resolve image dimensions");

  const pt = opts.statusBarPt ?? STATUS_BAR_PT;
  const scale = w / 390;
  const barH = Math.round(pt * scale);
  const contentH = h - barH;
  if (contentH < 100) throw new Error(`Status bar too tall (${barH}) for canvas ${h}`);

  const bar = await statusBarPng(w, barH);
  const content = await sharp(inputPathOrBuffer)
    .resize(w, contentH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  return sharp({
    create: { width: w, height: h, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } },
  })
    .composite([
      { input: bar, top: 0, left: 0 },
      { input: content, top: barH, left: 0 },
    ])
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
}
