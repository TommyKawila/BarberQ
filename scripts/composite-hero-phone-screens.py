#!/usr/bin/env python3
"""
Composite a real BarberQx mobile screenshot into the hero photo phone screens.

Source screen: public/marketing/screens/queue-ticket.webp
  (customer booking-confirmed — Thai, demo shop / dummy name)

Usage:
  python3 scripts/composite-hero-phone-screens.py

Reads *.ai-source.webp plates when present (original AI mockups), otherwise
the current hero webps. Writes public/marketing/photos/hero-{desktop,mobile}.webp.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "public/marketing/photos"
SCREEN = ROOT / "public/marketing/screens/queue-ticket.webp"

# Phone screen quads (TL, TR, BR, BL) in full-image pixel coords.
# Tuned to the AI barbershop hero plates (green chat placeholder → real UI).
DESKTOP_QUAD = np.array(
    [
        [1545, 215],
        [1905, 145],
        [2055, 935],
        [1665, 1010],
    ],
    dtype=np.float32,
)

MOBILE_QUAD = np.array(
    [
        [365, 495],
        [735, 485],
        [755, 1135],
        [385, 1145],
    ],
    dtype=np.float32,
)


def rounded_rect_mask(h: int, w: int, radius_frac: float = 0.08) -> np.ndarray:
    mask = np.zeros((h, w), dtype=np.uint8)
    r = int(min(h, w) * radius_frac)
    cv2.rectangle(mask, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(mask, (0, r), (w - 1, h - r - 1), 255, -1)
    cv2.circle(mask, (r, r), r, 255, -1)
    cv2.circle(mask, (w - r - 1, r), r, 255, -1)
    cv2.circle(mask, (r, h - r - 1), r, 255, -1)
    cv2.circle(mask, (w - r - 1, h - r - 1), r, 255, -1)
    return mask


def composite(hero_path: Path, quad: np.ndarray, out_path: Path) -> None:
    hero = cv2.imread(str(hero_path))
    if hero is None:
        raise SystemExit(f"missing hero plate: {hero_path}")
    screen = cv2.imread(str(SCREEN))
    if screen is None:
        raise SystemExit(f"missing screenshot: {SCREEN}")

    sh, sw = screen.shape[:2]
    src = np.array([[0, 0], [sw - 1, 0], [sw - 1, sh - 1], [0, sh - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(src, quad)
    warped = cv2.warpPerspective(
        screen,
        matrix,
        (hero.shape[1], hero.shape[0]),
        flags=cv2.INTER_LANCZOS4,
    )

    mask = rounded_rect_mask(sh, sw, 0.08)
    mask = cv2.GaussianBlur(mask, (0, 0), 1.5)
    warped_mask = cv2.warpPerspective(
        mask,
        matrix,
        (hero.shape[1], hero.shape[0]),
        flags=cv2.INTER_LINEAR,
    )

    # Slight warm dim so the UI sits in the barbershop lighting.
    warm = warped.astype(np.float32)
    warm[:, :, 0] *= 0.90  # B
    warm[:, :, 1] *= 0.96  # G
    warm[:, :, 2] *= 1.04  # R
    warm *= 0.90
    warm = np.clip(warm, 0, 255).astype(np.uint8)

    alpha = (warped_mask.astype(np.float32) / 255.0)[..., None]
    out = hero.astype(np.float32) * (1.0 - alpha) + warm.astype(np.float32) * alpha
    out = np.clip(out, 0, 255).astype(np.uint8)

    edge = cv2.Canny(warped_mask, 40, 120)
    edge = cv2.dilate(edge, np.ones((2, 2), np.uint8), iterations=1)
    edge = cv2.GaussianBlur(edge, (3, 3), 0)
    e = (edge.astype(np.float32) / 255.0)[..., None] * 0.22
    out = (out.astype(np.float32) * (1.0 - e)).clip(0, 255).astype(np.uint8)

    rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    Image.fromarray(rgb).save(out_path, "WEBP", quality=80, method=6)
    print(f"wrote {out_path.relative_to(ROOT)} ({out_path.stat().st_size} bytes)")


def plate_for(stem: str) -> Path:
    source = PHOTOS / f"{stem}.ai-source.webp"
    current = PHOTOS / f"{stem}.webp"
    return source if source.exists() else current


def main() -> None:
    if not SCREEN.exists():
        raise SystemExit(f"missing {SCREEN}")
    composite(plate_for("hero-desktop"), DESKTOP_QUAD, PHOTOS / "hero-desktop.webp")
    composite(plate_for("hero-mobile"), MOBILE_QUAD, PHOTOS / "hero-mobile.webp")


if __name__ == "__main__":
    main()
