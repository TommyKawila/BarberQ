import sharp from "sharp";

/**
 * Logical iOS top safe-area height (pt) when island metrics are unknown.
 * Clears Dynamic Island (~37–44px) + room for BrandMark / shop name.
 */
export const STATUS_BAR_PT = 74;

/**
 * Build a dark-mode iOS status bar SVG (time left, cellular/wifi/battery right).
 * Center stays empty for the Dynamic Island.
 */
export function statusBarSvg(width, height) {
  const scale = height / 54; // icon layout keyed to classic 54pt metrics
  const timeX = Math.round(28 * scale);
  const timeY = Math.round(Math.min(height * 0.62, 34 * scale));
  const fontSize = Math.round(15 * scale);
  const right = width - Math.round(14 * scale);
  const iconY = Math.round(Math.min(height * 0.38, 20 * scale));
  const battW = Math.round(25 * scale);
  const battH = Math.round(12 * scale);
  const battX = right - battW;
  const wifiX = battX - Math.round(22 * scale);
  const cellX = wifiX - Math.round(20 * scale);

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#09090b"/>
  <text x="${timeX}" y="${timeY}" fill="#fafafa" font-size="${fontSize}" font-weight="600"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif">9:41</text>
  <g fill="#fafafa">
    <rect x="${cellX}" y="${iconY + Math.round(7 * scale)}" width="${Math.round(3 * scale)}" height="${Math.round(4 * scale)}" rx="0.5"/>
    <rect x="${cellX + Math.round(5 * scale)}" y="${iconY + Math.round(5 * scale)}" width="${Math.round(3 * scale)}" height="${Math.round(6 * scale)}" rx="0.5"/>
    <rect x="${cellX + Math.round(10 * scale)}" y="${iconY + Math.round(3 * scale)}" width="${Math.round(3 * scale)}" height="${Math.round(8 * scale)}" rx="0.5"/>
    <rect x="${cellX + Math.round(15 * scale)}" y="${iconY + Math.round(1 * scale)}" width="${Math.round(3 * scale)}" height="${Math.round(10 * scale)}" rx="0.5"/>
  </g>
  <g fill="none" stroke="#fafafa" stroke-width="${Math.max(1.2, 1.5 * scale)}" stroke-linecap="round">
    <path d="M${wifiX} ${iconY + Math.round(9 * scale)} a${Math.round(5 * scale)} ${Math.round(5 * scale)} 0 0 1 ${Math.round(10 * scale)} 0"/>
    <path d="M${wifiX - Math.round(3 * scale)} ${iconY + Math.round(6 * scale)} a${Math.round(8 * scale)} ${Math.round(8 * scale)} 0 0 1 ${Math.round(16 * scale)} 0"/>
    <path d="M${wifiX - Math.round(6 * scale)} ${iconY + Math.round(3 * scale)} a${Math.round(11 * scale)} ${Math.round(11 * scale)} 0 0 1 ${Math.round(22 * scale)} 0"/>
  </g>
  <circle cx="${wifiX + Math.round(5 * scale)}" cy="${iconY + Math.round(11 * scale)}" r="${Math.round(1.4 * scale)}" fill="#fafafa"/>
  <rect x="${battX}" y="${iconY}" width="${battW}" height="${battH}" rx="${Math.round(2.5 * scale)}"
    fill="none" stroke="#fafafa" stroke-width="${Math.max(1, 1.25 * scale)}"/>
  <rect x="${battX + Math.round(2 * scale)}" y="${iconY + Math.round(2 * scale)}"
    width="${Math.round(16 * scale)}" height="${Math.round(8 * scale)}" rx="${Math.round(1.2 * scale)}" fill="#fafafa"/>
  <rect x="${battX + battW + Math.round(1 * scale)}" y="${iconY + Math.round(3.5 * scale)}"
    width="${Math.round(2 * scale)}" height="${Math.round(5 * scale)}" rx="${Math.round(0.8 * scale)}" fill="#fafafa"/>
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

  const bar = await sharp(statusBarSvg(w, barH)).png().toBuffer();
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
