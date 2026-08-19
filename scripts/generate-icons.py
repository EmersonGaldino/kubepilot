#!/usr/bin/env python3
"""
Generates KubePilot's app icon (iconset -> .icns via `iconutil`) and the
macOS menu-bar template icons. No external design assets — everything is
drawn procedurally with Pillow so the app has usable icons from the very
first run.
"""
import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "build")
PUBLIC_DIR = os.path.join(ROOT, "public")
ICONSET_DIR = os.path.join(BUILD_DIR, "icon.iconset")

os.makedirs(ICONSET_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_app_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.06)
    radius = int(size * 0.22)

    # Vertical gradient background, rounded square (macOS "squircle"-ish).
    top = (37, 99, 235)  # blue-600
    bottom = (12, 41, 99)  # deep navy
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(size):
        grad_draw.line([(0, y), (size, y)], fill=lerp_color(top, bottom, y / size))

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=255)
    img = Image.composite(grad, img, mask)
    draw = ImageDraw.Draw(img)

    # Compass ring.
    center = size / 2
    ring_r = size * 0.30
    draw.ellipse(
        [center - ring_r, center - ring_r, center + ring_r, center + ring_r],
        outline=(255, 255, 255, 235),
        width=max(2, int(size * 0.028)),
    )

    # Navigation needle (kite shape) pointing north, evoking a pilot/compass.
    needle_len = size * 0.24
    needle_w = size * 0.10
    angle = -90  # pointing up
    rad = math.radians(angle)
    tip = (center + needle_len * math.cos(rad), center + needle_len * math.sin(rad))
    tail = (center - needle_len * 0.55 * math.cos(rad), center - needle_len * 0.55 * math.sin(rad))
    perp = math.radians(angle + 90)
    left = (tail[0] + needle_w * math.cos(perp), tail[1] + needle_w * math.sin(perp))
    right = (tail[0] - needle_w * math.cos(perp), tail[1] - needle_w * math.sin(perp))
    draw.polygon([tip, left, right], fill=(255, 255, 255, 255))

    center_r = size * 0.028
    draw.ellipse(
        [center - center_r, center - center_r, center + center_r, center + center_r],
        fill=(255, 255, 255, 255),
    )

    return img


def draw_tray_template(size):
    """Black silhouette on transparent background — Electron/macOS tints
    this automatically for light/dark menu bars when `setTemplateImage` is
    used, so only alpha (shape) matters, not color."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size / 2
    ring_r = size * 0.36
    draw.ellipse(
        [center - ring_r, center - ring_r, center + ring_r, center + ring_r],
        outline=(0, 0, 0, 255),
        width=max(1, round(size * 0.09)),
    )

    needle_len = size * 0.30
    angle = -90
    rad = math.radians(angle)
    tip = (center + needle_len * math.cos(rad), center + needle_len * math.sin(rad))
    tail = (center - needle_len * 0.5 * math.cos(rad), center - needle_len * 0.5 * math.sin(rad))
    perp = math.radians(angle + 90)
    w = size * 0.12
    left = (tail[0] + w * math.cos(perp), tail[1] + w * math.sin(perp))
    right = (tail[0] - w * math.cos(perp), tail[1] - w * math.sin(perp))
    draw.polygon([tip, left, right], fill=(0, 0, 0, 255))

    return img


# --- App icon iconset (for iconutil -> .icns) ---
iconset_sizes = [16, 32, 64, 128, 256, 512, 1024]
for size in iconset_sizes:
    icon = draw_app_icon(size)
    if size <= 512:
        icon.save(os.path.join(ICONSET_DIR, f"icon_{size}x{size}.png"))
    half = size // 2
    if half in iconset_sizes or half == 512:
        icon.resize((half, half), Image.LANCZOS).save(
            os.path.join(ICONSET_DIR, f"icon_{half}x{half}@2x.png")
        )

# The 1024 image doubles as the @2x for 512.
draw_app_icon(1024).save(os.path.join(ICONSET_DIR, "icon_512x512@2x.png"))

# Also drop a flat PNG for the app icon at a convenient favicon-ish size.
draw_app_icon(512).save(os.path.join(PUBLIC_DIR, "app-icon.png"))

# --- macOS menu bar template icon (22pt @1x/@2x/@3x) ---
for scale, suffix in [(1, ""), (2, "@2x"), (3, "@3x")]:
    draw_tray_template(22 * scale).save(os.path.join(BUILD_DIR, f"trayTemplate{suffix}.png"))

print("Generated iconset at", ICONSET_DIR)
print("Generated tray templates in", BUILD_DIR)
