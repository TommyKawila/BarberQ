#!/usr/bin/env python3
"""
Composite the current admin queue board (landscape) onto Tommy's barber+iPad plate.

Redo after an admin redesign:
  1) Capture a fresh landscape board:
       node scripts/capture-admin-queue-landscape.mjs
  2) Re-run this script:
       python3 scripts/composite-barber-ipad-queue.py

Reads:
  public/marketing/photos/barber-desktop.ai-source.png   (Tommy plate, blank iPad)
  public/marketing/screens/admin-queue-landscape.webp    (or .png)

Writes:
  public/marketing/photos/barber-desktop.png
  public/marketing/photos/barber-desktop.webp
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "public/marketing/photos"
SCREENS = ROOT / "public/marketing/screens"

PLATE = PHOTOS / "barber-desktop.ai-source.png"
SCREEN_CANDIDATES = [
    SCREENS / "admin-queue-landscape.webp",
    SCREENS / "admin-queue-landscape.png",
    SCREENS / "raw" / "admin-queue-landscape.png",
]

# iPad glass quad (TL, TR, BR, BL) in plate pixel coords — 1672×941.
# Tuned to Tommy's barber-ipad.png; sits inside the thin bezel.
IPAD_QUAD = np.array(
    [
        [1016.05, 372.65],
        [1500.85, 391.85],
        [1592.05, 751.85],
        [1016.05, 708.65],
    ],
    dtype=np.float32,
)

CORNER_RADIUS_FRAC = 0.05


def rounded_rect_mask(h: int, w: int, radius_frac: float = CORNER_RADIUS_FRAC) -> np.ndarray:
    mask = np.zeros((h, w), dtype=np.uint8)
    r = max(2, int(min(h, w) * radius_frac))
    cv2.rectangle(mask, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(mask, (0, r), (w - 1, h - r - 1), 255, -1)
    cv2.circle(mask, (r, r), r, 255, -1)
    cv2.circle(mask, (w - r - 1, r), r, 255, -1)
    cv2.circle(mask, (r, h - r - 1), r, 255, -1)
    cv2.circle(mask, (w - r - 1, h - r - 1), r, 255, -1)
    return mask


def load_bgr(path: Path) -> np.ndarray:
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"missing image: {path}")
    return img


def find_screen() -> Path:
    for p in SCREEN_CANDIDATES:
        if p.exists():
            return p
    raise SystemExit(
        "missing landscape admin queue screenshot — run:\n"
        "  node scripts/capture-admin-queue-landscape.mjs"
    )


def skin_finger_mask(plate: np.ndarray, region_mask: np.ndarray) -> np.ndarray:
    """Keep barber fingertip that overlaps the glass."""
    hsv = cv2.cvtColor(plate, cv2.COLOR_BGR2HSV)
    lower = np.array([0, 25, 60], dtype=np.uint8)
    upper = np.array([35, 180, 255], dtype=np.uint8)
    skin = cv2.inRange(hsv, lower, upper)
    skin = cv2.bitwise_and(skin, region_mask)
    skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    skin = cv2.GaussianBlur(skin, (0, 0), 1.0)
    return skin


def glare_overlay(h: int, w: int) -> np.ndarray:
    """Soft warm glare from upper-right (shop vanity lights)."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = xx / max(w - 1, 1)
    ny = yy / max(h - 1, 1)
    band = np.exp(-((nx - 0.78) ** 2) / 0.18 - ((ny - 0.22) ** 2) / 0.35)
    band = band * np.clip(1.15 - ny * 0.7, 0.35, 1.0)
    glare = np.zeros((h, w, 3), dtype=np.float32)
    glare[:, :, 0] = band * 16
    glare[:, :, 1] = band * 26
    glare[:, :, 2] = band * 40
    return glare


def glass_mask(plate: np.ndarray, warped_round: np.ndarray, quad: np.ndarray) -> np.ndarray:
    """Keep composite inside the blank black glass (never spill onto bezel/counter)."""
    gray = cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY)
    dark = (gray < 28).astype(np.uint8) * 255
    dark = cv2.dilate(dark, np.ones((3, 3), np.uint8), iterations=1)
    poly = np.zeros(gray.shape, dtype=np.uint8)
    cv2.fillConvexPoly(poly, quad.astype(np.int32), 255)
    poly = cv2.dilate(poly, np.ones((7, 7), np.uint8))
    glass = cv2.bitwise_and(warped_round, dark)
    glass = cv2.bitwise_and(glass, poly)
    return cv2.GaussianBlur(glass, (0, 0), 0.5)


def composite() -> None:
    if not PLATE.exists():
        raise SystemExit(f"missing plate: {PLATE}")
    plate = load_bgr(PLATE)
    screen_path = find_screen()
    screen = load_bgr(screen_path)
    print(
        f"plate {plate.shape[1]}x{plate.shape[0]}  "
        f"screen {screen_path.name} {screen.shape[1]}x{screen.shape[0]}"
    )

    sh, sw = screen.shape[:2]
    src = np.array([[0, 0], [sw - 1, 0], [sw - 1, sh - 1], [0, sh - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(src, IPAD_QUAD)
    warped = cv2.warpPerspective(
        screen,
        matrix,
        (plate.shape[1], plate.shape[0]),
        flags=cv2.INTER_LANCZOS4,
    )

    mask = rounded_rect_mask(sh, sw)
    mask = cv2.GaussianBlur(mask, (0, 0), 0.6)
    warped_mask = cv2.warpPerspective(
        mask,
        matrix,
        (plate.shape[1], plate.shape[0]),
        flags=cv2.INTER_LINEAR,
    )
    glass = glass_mask(plate, warped_mask, IPAD_QUAD)

    ui = warped.astype(np.float32)
    ui[:, :, 0] *= 0.94
    ui[:, :, 1] *= 0.97
    ui[:, :, 2] *= 1.02
    ui *= 0.97
    ui = np.clip(ui + glare_overlay(plate.shape[0], plate.shape[1]), 0, 255)

    finger = skin_finger_mask(plate, glass)
    alpha = glass.astype(np.float32) / 255.0
    alpha *= 1.0 - finger.astype(np.float32) / 255.0
    alpha = alpha[..., None]

    out = ui * alpha + plate.astype(np.float32) * (1.0 - alpha)
    out = np.clip(out, 0, 255).astype(np.uint8)

    png_out = PHOTOS / "barber-desktop.png"
    webp_out = PHOTOS / "barber-desktop.webp"
    cv2.imwrite(str(png_out), out, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    ok = cv2.imwrite(str(webp_out), out, [cv2.IMWRITE_WEBP_QUALITY, 86])
    if not ok:
        from PIL import Image

        Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB)).save(
            webp_out, "WEBP", quality=86, method=4
        )

    print(f"wrote {png_out.relative_to(ROOT)}")
    print(f"wrote {webp_out.relative_to(ROOT)}")


if __name__ == "__main__":
    composite()
