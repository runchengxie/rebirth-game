#!/usr/bin/env python
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy>=2.0",
#   "opencv-python-headless>=4.10",
#   "pillow>=11.0",
#   "scipy>=1.14",
# ]
# ///
"""把白底立绘转换为透明背景，并清理指定区域的浅色水印。

直接运行 `uv run scripts/key_portrait.py ...`。脚本使用内联依赖，不会把图像处理栈
塞进项目日常开发环境。毕竟为了偶尔抠一张图安装半套科学计算宇宙，多少有些隆重。
"""

from __future__ import annotations

import sys
from importlib import import_module
from typing import Any


def load_dependencies() -> tuple[Any, Any, Any, Any]:
    """加载脚本专用依赖，并在普通 Python 调用时给出可执行提示。"""
    try:
        cv2 = import_module("cv2")
        numpy = import_module("numpy")
        image = import_module("PIL.Image")
        ndimage = import_module("scipy.ndimage")
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "缺少图像处理依赖。请使用 `uv run scripts/key_portrait.py ...` 运行。"
        ) from exc
    return cv2, numpy, image, ndimage


cv2, np, Image, ndimage = load_dependencies()


def key_white_to_transparent(arr: Any, white_thresh: int) -> None:
    height, width, _ = arr.shape
    rgb = arr[:, :, :3].astype(int)
    dist = np.sqrt(((rgb - 255) ** 2).sum(axis=2))
    near_white = dist < white_thresh
    seed = np.zeros_like(near_white)
    seed[0, :] = near_white[0, :]
    seed[-1, :] = near_white[-1, :]
    seed[:, 0] = near_white[:, 0]
    seed[:, -1] = near_white[:, -1]
    current = seed.copy()
    changed = True
    while changed:
        dilated = ndimage.binary_dilation(current)
        expanded = dilated & near_white
        changed = bool(expanded.sum() > current.sum())
        current = expanded
    arr[current, 3] = 0

    alpha = arr[:, :, 3]
    mask = alpha > 10
    closed = ndimage.binary_closing(mask, iterations=2)
    filled = ndimage.binary_fill_holes(closed)
    holes = filled & ~mask
    arr[holes, 3] = 0


def remove_watermark(
    arr: Any,
    y0: int,
    y1: int,
    x0: int,
    x1: int,
    inpaint_radius: int,
) -> int:
    height, width, _ = arr.shape
    y0, y1 = max(0, y0), min(height, y1)
    x0, x1 = max(0, x0), min(width, x1)
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[y0:y1, x0:x1] = 255
    bgr = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR)
    inpainted = cv2.inpaint(bgr, mask, inpaint_radius, cv2.INPAINT_NS)
    arr[:, :, :3] = cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB)

    region = arr[y0:y1, x0:x1]
    rgb = region[:, :, :3].astype(int)
    max_channel = rgb.max(axis=2)
    min_channel = rgb.min(axis=2)
    saturation = max_channel - min_channel
    alpha = region[:, :, 3]
    residual = (alpha > 20) & (max_channel < 245) & (max_channel > 50) & (saturation < 50)
    labels, count = ndimage.label(residual)
    clean = np.zeros_like(residual, dtype=np.bool_)
    for index in range(1, count + 1):
        ys, xs = np.where(labels == index)
        if 0 < len(ys) <= 5000:
            clean[ys, xs] = True
    clean = ndimage.binary_dilation(clean, iterations=3)
    ys, xs = np.where(clean)
    for y, x in zip(ys, xs, strict=True):
        yb0, yb1 = max(0, y - 6), min(region.shape[0], y + 7)
        xb0, xb1 = max(0, x - 6), min(region.shape[1], x + 7)
        window = region[yb0:yb1, xb0:xb1]
        sample = window[
            (~clean[yb0:yb1, xb0:xb1]) & (window[:, :, 3] > 20),
            :3,
        ]
        if len(sample) > 0:
            region[y, x, :3] = np.median(sample, axis=0).astype(np.uint8)
        else:
            region[y, x, 3] = 0
    return len(ys)


def parse_region(width: int, height: int) -> tuple[int, int, int, int]:
    if len(sys.argv) >= 8:
        return (
            int(sys.argv[4]),
            int(sys.argv[5]),
            int(sys.argv[6]),
            int(sys.argv[7]),
        )
    return height - 160, height, width - 260, width


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: key_portrait.py <src> <out> [white_thresh] [wm_y0 y1 x0 x1] [inpaint_radius]")
        raise SystemExit(1)

    src, out = sys.argv[1], sys.argv[2]
    white_thresh = int(sys.argv[3]) if len(sys.argv) > 3 else 28
    width, height = Image.open(src).size
    y0, y1, x0, x1 = parse_region(width, height)
    inpaint_radius = int(sys.argv[8]) if len(sys.argv) > 8 else 7

    image = Image.open(src).convert("RGBA")
    arr = np.array(image)
    key_white_to_transparent(arr, white_thresh)
    cleaned = remove_watermark(arr, y0, y1, x0, x1, inpaint_radius)
    Image.fromarray(arr).save(out)
    transparent = 100.0 * (arr[:, :, 3] < 10).sum() / (width * height)
    print(f"{out}: {width}x{height} transparent={transparent:.1f}% residual_pixels={cleaned}")


if __name__ == "__main__":
    main()
