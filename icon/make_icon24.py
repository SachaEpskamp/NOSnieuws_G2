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

# ---- Aids for hand-copying the icon into the Hub's built-in grid editor ----

# Gridded reference image: 20px cells, gray gridlines, heavier every 4 cells.
CELL = 20
GW, GH = W * CELL + 1, H * CELL + 1
ref = [[30] * GW for _ in range(GH)]
for r in range(H):
    for c in range(W):
        if grid[r][c]:
            for y in range(r * CELL + 1, (r + 1) * CELL):
                for x in range(c * CELL + 1, (c + 1) * CELL):
                    ref[y][x] = 255
for i in range(0, W + 1):
    shade = 140 if i % 4 == 0 else 80
    for y in range(GH):
        ref[y][min(i * CELL, GW - 1)] = shade
for i in range(0, H + 1):
    shade = 140 if i % 4 == 0 else 80
    for x in range(GW):
        ref[min(i * CELL, GH - 1)][x] = shade
write_png(os.path.join(here, 'icon-24-grid.png'), ref)

# Per-row run-length instructions + ASCII map (rows/cols numbered from 0).
lines = ['# Hand-drawing instructions for the Even Hub 24x24 icon editor',
         '',
         'White pixels on a black/empty background. Rows and columns are',
         'numbered 0-23 from the top-left. Fill exactly these runs:',
         '']
for r in range(H):
    runs, c = [], 0
    while c < W:
        if grid[r][c]:
            start = c
            while c < W and grid[r][c]:
                c += 1
            runs.append(f'{start}-{c - 1}' if c - 1 > start else f'{start}')
        else:
            c += 1
    if runs:
        lines.append(f'row {r:2d}: columns {", ".join(runs)}')
lines += ['', 'ASCII map (# = white pixel):', '',
          '      ' + ''.join(str(c % 10) for c in range(W))]
for r in range(H):
    lines.append(f'  {r:2d}  ' + ''.join('#' if v else '.' for v in grid[r]))
lines.append('')
with open(os.path.join(here, 'DRAW_INSTRUCTIONS.md'), 'w') as f:
    f.write('\n'.join(lines))
print('icon-24-grid.png and DRAW_INSTRUCTIONS.md written')
