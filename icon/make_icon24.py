#!/usr/bin/env python3
"""Generate the Even Hub 24x24 monochrome app icon (white "NOS" on black).

Spec (official App Submission & QA Guidelines, via naotake/g2-icon-studio):
  - 24x24 px, monochrome/grayscale only (color is rejected)
  - both foreground and background required; white-on-dark is the accepted form
  - legible, no noisy patterns; aim ~12-55% ink coverage

Pixel-art "NOS" wordmark: 3 letters, 6px wide, 10px tall, 2px stroke.
Outputs a true grayscale (color type 0) PNG plus an x8 nearest-neighbour
preview. Stdlib only — no dependencies.
"""
import struct, zlib, os

W = H = 24
grid = [[0] * W for _ in range(H)]

def rect(r0, r1, c0, c1):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            grid[r][c] = 255

# Letters occupy rows 7-16 (10 tall, vertically centered), cols 1-22.
# N (cols 1-6): two stems + stepped diagonal
rect(7, 16, 1, 2); rect(7, 16, 5, 6)
rect(8, 11, 3, 3); rect(12, 15, 4, 4)
# O (cols 9-14): rounded box
rect(7, 8, 10, 13); rect(15, 16, 10, 13)
rect(9, 14, 9, 10); rect(9, 14, 13, 14)
# S (cols 17-22): three bars + two elbows
rect(7, 8, 18, 22); rect(9, 10, 17, 18)
rect(11, 12, 18, 21); rect(13, 14, 21, 22)
rect(15, 16, 17, 21)

def write_png(path, pixels):
    """Minimal grayscale 8-bit PNG writer (color type 0)."""
    h, w = len(pixels), len(pixels[0])
    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0)  # 8-bit grayscale
    raw = b''.join(b'\x00' + bytes(row) for row in pixels)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)

here = os.path.dirname(os.path.abspath(__file__))
write_png(os.path.join(here, 'icon-24.png'), grid)

SCALE = 8  # nearest-neighbour preview so humans can judge legibility
big = [[grid[r // SCALE][c // SCALE] for c in range(W * SCALE)] for r in range(H * SCALE)]
write_png(os.path.join(here, 'icon-24-preview-x8.png'), big)

ink = sum(1 for row in grid for v in row if v) / (W * H)
print(f'icon-24.png written; ink coverage {ink:.1%} (target 12-55%)')
