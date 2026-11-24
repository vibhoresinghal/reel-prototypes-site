"""Generate the "Pixel-fi" theme artwork for PayZapp Recap 2026.

Run from this folder:  python build-pixel-art.py
Writes assets/themes/pixel/{wordmark,lockup,cover,backdrop,preview,corners,paper}.svg

Everything is drawn from square cells with shape-rendering="crispEdges", so it
stays sharp at any size. Two pixel scales are used on purpose:
  * big pixels (24-36 px) for backgrounds, page corners and hills;
  * small pixels (3-6 px) for type, sparkles, the cursor and other details.
Files are standalone (no CSS variables) so html2canvas share cards match.
"""
import os
import random
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'assets', 'themes', 'pixel')
TILE = re.sub(r'^<svg[^>]*>|</svg>$', '', open(os.path.join(HERE, 'assets', 'pz-tile.svg')).read())
RINGS = re.sub(r'<\?xml[^>]*>', '', open(os.path.join(HERE, 'assets', 'flipbook-rings.svg')).read())

# Palette sampled from the reference: electric violet into hot pink, lime pops.
INK = '#1B0F4A'       # outlines and 3D extrusion
DEEP = '#2A1680'
VIOLET = '#4A2BD6'
PURPLE = '#6B44F2'
LILAC = '#A98BFF'
LAVENDER = '#DCD0FF'
MAGENTA = '#C24FE0'
PINK = '#FF7AD0'
BLUSH = '#FFC2EA'
LIME = '#CDF34B'
LIME_DARK = '#8FC21B'
CYAN = '#7FE6FF'
WHITE = '#FFFFFF'
SKY = [(0, '#3A2BD8'), (.38, '#6A3BEA'), (.7, '#B34FDF'), (1, '#FF86C8')]

# ---------------------------------------------------------------- pixel type
# 6x7 chunky glyphs (two-cell strokes), drawn in the reference's heavy style.
GLYPHS = {
    'R': ['11111.', '11..11', '11..11', '11111.', '11.11.', '11..11', '11..11'],
    'E': ['111111', '11....', '11....', '11111.', '11....', '11....', '111111'],
    'C': ['.1111.', '11..11', '11....', '11....', '11....', '11..11', '.1111.'],
    'A': ['.1111.', '11..11', '11..11', '111111', '11..11', '11..11', '11..11'],
    'P': ['11111.', '11..11', '11..11', '11111.', '11....', '11....', '11....'],
    'Y': ['11..11', '11..11', '.1111.', '..11..', '..11..', '..11..', '..11..'],
    'Z': ['111111', '....11', '...11.', '..11..', '.11...', '11....', '111111'],
    '2': ['.1111.', '11..11', '....11', '...11.', '..11..', '.11...', '111111'],
    '0': ['.1111.', '11..11', '11.111', '111.11', '11..11', '11..11', '.1111.'],
    '6': ['.1111.', '11....', '11....', '11111.', '11..11', '11..11', '.1111.'],
    ' ': ['...', '...', '...', '...', '...', '...', '...'],
}


def text_cells(text, gap=1):
    """Cells (x, y) for a string, plus its width in cells."""
    cells, x = [], 0
    for ch in text:
        g = GLYPHS[ch]
        for y, row in enumerate(g):
            for dx, c in enumerate(row):
                if c == '1':
                    cells.append((x + dx, y))
        x += len(g[0]) + gap
    return cells, x - gap


def runs(cells):
    """Merge cells into horizontal runs -> (x, y, w)."""
    out = []
    rows = {}
    for x, y in cells:
        rows.setdefault(y, set()).add(x)
    for y, xs in rows.items():
        xs = sorted(xs)
        start = prev = xs[0]
        for x in xs[1:]:
            if x != prev + 1:
                out.append((start, y, prev - start + 1))
                start = x
            prev = x
        out.append((start, y, prev - start + 1))
    return out


def cells_path(cells, u, ox=0, oy=0):
    return ''.join(f'M{ox + x*u:g} {oy + y*u:g}h{w*u:g}v{u:g}h{-w*u:g}z' for x, y, w in runs(cells))


def outline(cells, r=1):
    s = set(cells)
    out = set()
    for x, y in s:
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                out.add((x + dx, y + dy))
    return out


def extrude(cells, depth):
    s = set(cells)
    out = set()
    for x, y in s:
        for k in range(1, depth + 1):
            out.add((x + k, y + k))
    return out


def pixel_word(text, u, face, shade, ox, oy, depth=2, gap=1):
    """A 3D pixel word: ink extrusion + ink outline + face + shaded lower band."""
    cells, w = text_cells(text, gap)
    solid = outline(set(cells) | extrude(cells, depth))
    shade_cells = [(x, y) for x, y in cells if y >= 5]
    hi_cells = [(x, y) for x, y in cells if y == 0]
    p = [f'<path d="{cells_path(solid, u, ox, oy)}" fill="{INK}"/>',
         f'<path d="{cells_path(cells, u, ox, oy)}" fill="{face}"/>',
         f'<path d="{cells_path(shade_cells, u, ox, oy)}" fill="{shade}"/>',
         f'<path d="{cells_path(hi_cells, u, ox, oy)}" fill="#FFFFFF" opacity=".55"/>']
    return ''.join(p), (w + depth + 2) * u, (7 + depth + 2) * u


def sparkle(cx, cy, u, color, size=2):
    """4-point pixel star: a plus with longer arms and a white core."""
    cells = [(0, 0)]
    for k in range(1, size + 1):
        cells += [(k, 0), (-k, 0), (0, k), (0, -k)]
    if size >= 2:
        cells += [(1, 1), (-1, 1), (1, -1), (-1, -1)]
    path = ''.join(f'M{cx + x*u - u/2:g} {cy + y*u - u/2:g}h{u:g}v{u:g}h{-u:g}z' for x, y in cells)
    return f'<path d="{path}" fill="{color}"/><rect x="{cx - u/2:g}" y="{cy - u/2:g}" width="{u:g}" height="{u:g}" fill="#FFFFFF"/>'


CURSOR = ['1...........',
          '11..........',
          '1w1.........',
          '1ww1........',
          '1www1.......',
          '1wwww1......',
          '1wwwww1.....',
          '1wwwwww1....',
          '1wwwwwww1...',
          '1wwwwwwww1..',
          '1wwwww11111.',
          '1ww1ww1.....',
          '1w1.1ww1....',
          '11..1ww1....',
          '1....1ww1...',
          '.....1ww1...',
          '......11....']


def cursor(ox, oy, u):
    ink = [(x, y) for y, r in enumerate(CURSOR) for x, c in enumerate(r) if c == '1']
    fill = [(x, y) for y, r in enumerate(CURSOR) for x, c in enumerate(r) if c == 'w']
    shadow = [(x + 1, y + 1) for x, y in ink + fill]
    return (f'<path d="{cells_path(shadow, u, ox, oy)}" fill="{INK}" opacity=".45"/>'
            f'<path d="{cells_path(ink, u, ox, oy)}" fill="{INK}"/>'
            f'<path d="{cells_path(fill, u, ox, oy)}" fill="{WHITE}"/>')


def pixel_ring(cx, cy, rx, ry, u, color, dash=3, gap=2):
    """Dotted elliptical orbit snapped to the pixel grid (back half fainter)."""
    import math
    pts = []
    n = int(2 * math.pi * max(rx, ry) / u)
    seen = set()
    for i in range(n):
        if i % (dash + gap) >= dash:
            continue
        a = 2 * math.pi * i / n
        x = round((cx + rx * math.cos(a)) / u) * u
        y = round((cy + ry * math.sin(a)) / u) * u
        if (x, y) in seen:
            continue
        seen.add((x, y))
        back = math.sin(a) < 0
        pts.append(f'<rect x="{x:g}" y="{y:g}" width="{u:g}" height="{u:g}" fill="{color}" opacity="{.55 if back else 1}"/>')
    return ''.join(pts)


# ---------------------------------------------------------------- big-pixel backgrounds

def gradient(gid, stops, x2='0', y2='1'):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{gid}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def blocks(rng, cluster, u, colors, origin, flip_x=False, flip_y=False, opacity=1):
    """Stepped cluster of big pixels. `cluster` is a list of row strings, each char
    a colour index (1-9) into `colors` or '.' for empty."""
    ox, oy = origin
    out = []
    for y, row in enumerate(cluster):
        for x, c in enumerate(row):
            if c == '.':
                continue
            px = ox - (x + 1) * u if flip_x else ox + x * u
            py = oy - (y + 1) * u if flip_y else oy + y * u
            out.append(f'<rect x="{px:g}" y="{py:g}" width="{u:g}" height="{u:g}" fill="{colors[int(c) - 1]}"/>')
    return f'<g opacity="{opacity}">' + ''.join(out) + '</g>'


def dither_band(x0, y0, w, h, u, color, density_top, density_bottom, rng, opacity=1):
    """Ordered-dither fade between two densities: the reference's checker transitions."""
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    rows, cols = int(h // u), int(w // u)
    out = []
    for r in range(rows):
        d = density_top + (density_bottom - density_top) * (r / max(1, rows - 1))
        for c in range(cols):
            if bayer[r % 4][c % 4] / 16 < d:
                out.append(f'M{x0 + c*u:g} {y0 + r*u:g}h{u:g}v{u:g}h{-u:g}z')
    return f'<path d="{"".join(out)}" fill="{color}" opacity="{opacity}"/>'


def hills(x0, x1, base, u, rng, fill, top, heights):
    """Stepped pixel hills: columns of big pixels with a lime cap."""
    out_fill, out_top = [], []
    cols = int((x1 - x0) // u) + 1
    for c in range(cols):
        h = heights[c % len(heights)]
        x = x0 + c * u
        out_fill.append(f'M{x:g} {base - h*u:g}h{u:g}v{h*u + 400:g}h{-u:g}z')
        out_top.append(f'M{x:g} {base - h*u:g}h{u:g}v{u/2:g}h{-u:g}z')
    return f'<path d="{"".join(out_fill)}" fill="{fill}"/><path d="{"".join(out_top)}" fill="{top}"/>'


C_TL = ['3321.', '21...', '1....', '4....', '.....', '1....']
C_TR = ['.1233', '...14', '....2', '....1', '.....', '....3']
C_BL = ['1....', '21...', '342..', '4321.', '33421']
C_BR = ['....2', '...13', '..243', '.1234', '24334']


def cover_parts(w=540, h=600, uid='c'):
    """Calm composition: one gradient, a dark dither fade at the top, two stepped
    big-pixel clusters on a diagonal (top-right, bottom-left), a single hill line
    and three sparkles. The centre stays clear for the wordmark."""
    rng = random.Random(3)
    u = 36
    p = ['<defs>', gradient(f'{uid}-sky', SKY), '</defs>',
         f'<rect width="{w}" height="{h}" fill="url(#{uid}-sky)"/>',
         dither_band(0, 0, w, 96, 12, '#2A1C9E', .5, 0, rng, .55)]
    # Top-right: a stepped staircase of big pixels in two colours.
    p.append(blocks(rng, ['..112', '...12', '....1'], u, [LILAC, LIME], (w - 5 * u, 0), opacity=.9))
    # One hill line, deep violet with a lime cap.
    p.append(hills(-12, w, h - 24, 24, rng, VIOLET, LIME,
                   [2, 2, 2, 3, 3, 3, 4, 4, 3, 3, 2, 2, 2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 2, 2]))
    # Bottom-left: the mirrored staircase, sitting in front of the hill.
    p.append(blocks(rng, ['1....', '12...', '221..'], u, [PINK, LIME], (0, h - 3 * u)))
    for x, y, c, s in [(92, 150, LIME, 2), (462, 300, WHITE, 2), (120, 360, WHITE, 1)]:
        p.append(sparkle(x, y, 6, c, s))
    return p


def cover():
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="540" height="600" viewBox="0 0 540 600" '
            'preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" aria-hidden="true">'
            + ''.join(cover_parts()) + '</svg>')


# ---------------------------------------------------------------- wordmarks

def wordmark_group(u=3):
    """Two-line pixel wordmark: RECAP (white) over 2026 (lime)."""
    recap, rw, rh = pixel_word('RECAP', u, WHITE, LAVENDER, 0, 0, depth=2)
    year, yw, yh = pixel_word('2026', u, LIME, LIME_DARK, (rw - text_cells('2026')[1] * u - 4 * u) / 2 + 2 * u, rh - u, depth=2)
    return recap + year, rw, rh + yh - u


def wordmark():
    """Header wordmark: small PAYZAPP over RECAP 2026 on one line."""
    u = 2
    pz, pw, ph = pixel_word('PAYZAPP', 1.4, WHITE, LAVENDER, 0, 0, depth=1)
    rc, rw, rh = pixel_word('RECAP', u, WHITE, LAVENDER, 0, 0, depth=2)
    yr, yw, yh = pixel_word('2026', u, LIME, LIME_DARK, 0, 0, depth=2)
    width = rw + 3 * u + yw
    height = ph + rh
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:g}" height="{height:g}" viewBox="0 0 {width:g} {height:g}" '
            f'shape-rendering="crispEdges" role="img" aria-label="PayZapp recap 2026">'
            f'<g transform="translate({(width - pw)/2:g} 0)">{pz}</g>'
            f'<g transform="translate(0 {ph - 2:g})">{rc}</g>'
            f'<g transform="translate({rw + 3*u:g} {ph - 2:g})">{yr}</g></svg>')


def lockup_body(uid):
    """PayZapp tile, then the big italic RECAP / 2026 with orbit, sparkles and cursor.
    Coordinate space 160 x 190."""
    word, ww, wh = wordmark_group(4)
    scale_w = 150
    sx = scale_w / ww
    parts = [pixel_ring(80, 142, 78, 22, 3, PINK)]
    parts.append(f'<g transform="translate(5 74) scale({sx:.4f}) skewX(-8) translate(12 0)">{word}</g>')
    parts.append(f'<g>{pixel_ring_front(80, 142, 78, 22, 3, PINK)}</g>')
    parts.append(sparkle(14, 76, 3, LIME, 2) + sparkle(152, 70, 3, WHITE, 1) + sparkle(24, 110, 3, WHITE, 1))
    parts.append(f'<g transform="translate(116 150)">{cursor(0, 0, 2.2)}</g>')
    return ''.join(parts)


def pixel_ring_front(cx, cy, rx, ry, u, color, dash=3, gap=2):
    """Front half of the orbit, drawn over the type so the ring wraps around it."""
    import math
    pts, seen = [], set()
    n = int(2 * math.pi * max(rx, ry) / u)
    for i in range(n):
        if i % (dash + gap) >= dash:
            continue
        a = 2 * math.pi * i / n
        if math.sin(a) < 0.35:
            continue
        x = round((cx + rx * math.cos(a)) / u) * u
        y = round((cy + ry * math.sin(a)) / u) * u
        if (x, y) in seen:
            continue
        seen.add((x, y))
        pts.append(f'<rect x="{x:g}" y="{y:g}" width="{u:g}" height="{u:g}" fill="{color}"/>')
    return ''.join(pts)


def lockup():
    # The tile in pz-tile.svg is authored at x 37..101 (64 wide); place it centred.
    tile = f'<svg x="48" y="0" width="64" height="64" viewBox="37 0 64 64">{TILE}</svg>'
    body = lockup_body('lk')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="190" viewBox="0 0 160 190" fill="none" '
            'shape-rendering="crispEdges" role="img" aria-label="PayZapp recap 2026">'
            + tile + body + '</svg>')


# ---------------------------------------------------------------- page layers

TWINKLE_CSS = ('<style>.tw0,.tw1,.tw2{animation:tw 5.4s steps(1) infinite}.tw1{animation-delay:-1.8s;animation-duration:6.6s}'
               '.tw2{animation-delay:-3.6s;animation-duration:4.8s}'
               '@keyframes tw{0%,100%{opacity:1}40%{opacity:.45}55%{opacity:.7}70%{opacity:1}}'
               '@media (prefers-reduced-motion:reduce){.tw0,.tw1,.tw2{animation:none}}</style>')


def twinkle(svg_fragment):
    """Give each rect in a fragment one of three stepped twinkle rhythms."""
    i = [0]

    def tag(m):
        i[0] += 1
        return f'<rect class="tw{i[0] % 3}" '
    return re.sub(r'<rect ', tag, svg_fragment)


def floor():
    """Bottom-of-page glow: an ordered-dither fade of soft white pixels that mirrors
    the dither along the top edge, plus a few single pixels that twinkle in steps.
    One seamless 480x240 tile; colour comes from the page underneath."""
    rng = random.Random(12)
    cell = 8
    band = dither_band(0, 0, 480, 240, cell, '#FFFFFF', 0, .62, rng, .11)
    twinkles = []
    for x, y in [(40, 150), (136, 96), (200, 188), (288, 132), (352, 200), (424, 112), (96, 216), (456, 172)]:
        twinkles.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="#FFFFFF" fill-opacity=".55"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" '
            'shape-rendering="crispEdges" aria-hidden="true">' + TWINKLE_CSS + band + twinkle(''.join(twinkles)) + '</svg>')


def backdrop():
    """Static preview of the page floor on the theme violet."""
    inner = re.sub(r'^<svg[^>]*>|</svg>$', '', floor())
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240" '
            'preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" aria-hidden="true">'
            f'<rect width="720" height="240" fill="{VIOLET}"/>{inner}<g transform="translate(480 0)">{inner}</g></svg>')


def corners():
    """Top-of-page big-pixel clusters and dither (720x420, top-anchored). Soft white
    blocks that suit any page colour, twinkling in stepped rhythms."""
    rng = random.Random(4)
    u = 36
    p = [dither_band(0, 0, 720, 120, 12, '#000000', .5, 0, rng, .14),
         twinkle(blocks(rng, ['21.', '1..', '3..', '...', '4..'], u, ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], (0, 96), opacity=.2)),
         twinkle(blocks(rng, ['.12', '..3', '..1', '...', '..4'], u, ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], (720 - 3 * u, 96), opacity=.2))]
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420" '
            'preserveAspectRatio="xMidYMin slice" shape-rendering="crispEdges" aria-hidden="true">' + TWINKLE_CSS + ''.join(p) + '</svg>')


def paper():
    """Question-page texture: translucent white big pixels in the top corners and two
    small sparkles. White only, so it sits on whatever colour the card art sets, and
    nothing at the bottom edge so the page joins the art below without a seam (300x320)."""
    rng = random.Random(6)
    u = 20
    p = [blocks(rng, ['11.', '1..', '...'], u, ['#FFFFFF'], (0, 0), opacity=.3),
         blocks(rng, ['.11', '..1', '...'], u, ['#FFFFFF'], (300 - 3 * u, 0), opacity=.3),
         sparkle(268, 120, 4, PURPLE, 1), sparkle(30, 170, 4, PINK, 1)]
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="320" viewBox="0 0 300 320" '
            'preserveAspectRatio="xMidYMin slice" shape-rendering="crispEdges" aria-hidden="true">' + ''.join(p) + '</svg>')


def rings():
    """Pixel binding rings for the flipbook (same 262x34 footprint as the original):
    a dark stepped hole and a lilac ring with a highlight and shade column."""
    u = 2
    hole = ['..111111..', '.11111111.'] + ['1111111111'] * 6 + ['.11111111.', '..111111..']
    ring = ['.1111.'] + ['111111'] * 13 + ['.1111.']
    out = []
    for k in range(6):
        ox = round(k * 48.45 / u)
        h = [(ox + x, 7 + y) for y, r in enumerate(hole) for x, c in enumerate(r) if c == '1']
        r = [(ox + 2 + x, y) for y, row in enumerate(ring) for x, c in enumerate(row) if c == '1']
        hi = [(x, y) for x, y in r if x == ox + 3 and 1 <= y <= 12]
        sh = [(x, y) for x, y in r if x == ox + 6 and 1 <= y <= 13]
        out.append(f'<path d="{cells_path(h, u)}" fill="#2A1680" fill-opacity=".55"/>'
                   f'<path d="{cells_path(r, u)}" fill="#DCD0FF"/>'
                   f'<path d="{cells_path(hi, u)}" fill="#FFFFFF"/>'
                   f'<path d="{cells_path(sh, u)}" fill="#A98BFF"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="262" height="34" viewBox="0 0 262 34" '
            'shape-rendering="crispEdges" aria-hidden="true">' + ''.join(out) + '</svg>')


def preview():
    art = ''.join(cover_parts(uid='pv'))
    rings = re.sub(r'<svg[^>]*>', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" x="52" y="0" width="436" height="56.6" viewBox="0 0 262 34" fill="none">', RINGS, count=1)
    body = lockup_body('pv')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="540" height="676" viewBox="0 0 540 676" shape-rendering="crispEdges" role="img" aria-label="PayZapp recap 2026 flipbook">
<defs><clipPath id="pv-card"><rect x="0" y="22" width="540" height="654" rx="34"/></clipPath></defs>
<g clip-path="url(#pv-card)"><rect x="0" y="22" width="540" height="654" fill="{SKY[0][1]}"/>
<g transform="translate(0 76)">{art}</g>
<rect x="0" y="118" width="540" height="3" fill="#000" opacity=".12"/></g>
{rings}
<g transform="translate(110 150) scale(2)"><svg x="48" y="0" width="64" height="64" viewBox="37 0 64 64">{TILE}</svg>{body}</g>
</svg>'''



# ---------------------------------------------------------------- card scenes (item: hand-drawn pixel art)
# Six card backgrounds drawn as pixel art on a 52x50 grid of 12px cells (624x600,
# the original illustration size). The top ~17 rows stay calm because the trivia
# text sits there; the middle stays open for each card's animated objects.

class Grid:
    COLS, ROWS, CELL = 52, 50, 12

    def __init__(self):
        self.c = [[None] * self.COLS for _ in range(self.ROWS)]

    def put(self, x, y, col):
        if 0 <= x < self.COLS and 0 <= y < self.ROWS and col:
            self.c[y][x] = col

    def rect(self, x, y, w, h, col):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(xx, yy, col)

    def bands(self, stops):
        """stops: [(row, colour)] solid from each row to the next."""
        for i, (row, col) in enumerate(stops):
            end = stops[i + 1][0] if i + 1 < len(stops) else self.ROWS
            self.rect(0, row, self.COLS, end - row, col)

    def dither(self, y0, y1, col, d0=0.0, d1=1.0):
        """Ordered-dither `col` over rows y0..y1, density rising d0 -> d1."""
        bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
        for y in range(y0, y1):
            d = d0 + (d1 - d0) * (y - y0) / max(1, y1 - y0 - 1)
            for x in range(self.COLS):
                if bayer[y % 4][x % 4] / 16 < d:
                    self.put(x, y, col)

    def sprite(self, x, y, rows, palette):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                if ch != '.':
                    self.put(x + dx, y + dy, palette[ch])

    def svg(self):
        by = {}
        for y, row in enumerate(self.c):
            for x, col in enumerate(row):
                if col:
                    by.setdefault(col, []).append((x, y))
        s = self.CELL
        paths = ''.join(f'<path d="{cells_path(cells, s)}" fill="{col}"/>' for col, cells in by.items())
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.COLS*s}" height="{self.ROWS*s}" '
                f'viewBox="0 0 {self.COLS*s} {self.ROWS*s}" shape-rendering="crispEdges">{paths}</svg>')


CLOUD = ['...www....', '.wwwwwww..', 'wwwwwwwwww', '.sssssss..']
NOTE = ['gggggg', 'gGGGGg', 'gGggGg', 'gGGGGg', 'gggggg']
HEART = ['.pp.pp.', 'pwpppPp', 'ppppPPp', '.pppPP.', '..pPP..', '...P...']
COIN = ['.yyy.', 'yYYYy', 'yYyYy', 'yYYYy', '.yyy.']
SPARK = ['.w.', 'www', '.w.']
PAL = {'w': '#FFFFFF', 's': '#DCD0FF', 'g': '#8FC21B', 'G': '#E9FBB0', 'p': '#FF7AD0', 'P': '#C24FE0',
       'y': '#FFE45C', 'Y': '#FFF3C4', 'k': '#1B0F4A', 'l': '#A98BFF', 'L': '#6B44F2'}


def scene_cash():
    g = Grid()
    g.bands([(0, '#BDEFFF'), (30, '#7FE6FF')])
    g.dither(17, 30, '#7FE6FF', 0, 1)
    g.dither(42, 50, '#BDEFFF', 0, .8)
    for x, y in [(-3, 21), (40, 24), (4, 37), (44, 40)]:
        g.sprite(x, y, CLOUD, PAL)
    for x, y in [(10, 25), (36, 33), (14, 44), (30, 21), (41, 46)]:
        g.sprite(x, y, NOTE, PAL)
    for x, y in [(24, 19), (6, 31), (47, 30)]:
        g.sprite(x, y, SPARK, PAL)
    return g


def scene_shop():
    import math
    g = Grid()
    g.bands([(0, '#FFF3C4'), (28, '#FFE45C')])
    g.dither(17, 28, '#FFE45C', 0, 1)
    # Bunting: one continuous sagging string with triangular flags hanging off it.
    flags = ['#FF7AD0', '#CDF34B', '#7FE6FF', '#A98BFF']
    ys = [18 + round(2.2 * math.sin(math.pi * x / 51)) for x in range(52)]
    for x, y in enumerate(ys):
        g.put(x, y, '#C24FE0')
        if x > 0 and ys[x - 1] != y:
            g.put(x, min(y, ys[x - 1]), '#C24FE0')
    for i, x in enumerate(range(2, 50, 6)):
        col = flags[i % 4]
        y = ys[x + 1] + 1
        g.rect(x, y, 3, 1, col)
        g.put(x + 1, y + 1, col)
    # Shopping bags drifting at the sides.
    bag = ['..kk...', '.k..k..', 'bbbbbbb', 'bBbbbbb', 'bBbbbbb', 'bbbbbbb', 'bbbbbbb']
    for x, y, c in [(3, 27, '#FF7AD0'), (43, 30, '#A98BFF'), (7, 38, '#A98BFF'), (41, 40, '#FF7AD0')]:
        g.sprite(x, y, bag, {'k': '#C24FE0', 'b': c, 'B': '#FFFFFF'})
    for y in range(44, 50):
        for x in range(52):
            g.put(x, y, '#FFF3C4' if (x // 2 + y // 2) % 2 else '#FFE45C')
    return g


def scene_month():
    g = Grid()
    g.bands([(0, '#E9FBB0'), (24, '#FFE3F1'), (30, '#FFC2EA')])
    g.dither(17, 24, '#FFE3F1', 0, 1)
    g.dither(24, 30, '#FFC2EA', 0, 1)
    # Setting sun on the horizon.
    for dy, w in enumerate([6, 10, 12, 14, 14]):
        g.rect(26 - w // 2, 29 + dy, w, 1, '#FFE45C')
    import math
    for x in range(52):
        back = 34 + round(2 * math.sin(x / 52 * 2 * math.pi + 1.2) + math.sin(x / 52 * 6 * math.pi))
        g.rect(x, back, 1, 50 - back, '#CDF34B')
        front = 39 + round(2.5 * math.sin(x / 52 * 2 * math.pi + 4) + math.sin(x / 52 * 4 * math.pi + 1))
        g.rect(x, front, 1, 50 - front, '#8FC21B')
        g.put(x, front, '#CDF34B')
    for x in (5, 9, 44, 48):
        top = 39 + round(2.5 * math.sin(x / 52 * 2 * math.pi + 4) + math.sin(x / 52 * 4 * math.pi + 1))
        g.sprite(x - 1, top - 5, ['.g.', 'ggg', 'ggg', '.B.', '.B.'], {'g': '#2FA35A', 'B': '#8A4E2E'})
    return g


def scene_streak():
    g = Grid()
    g.bands([(0, '#F3EEFF'), (26, '#DCD0FF'), (36, '#A98BFF')])
    g.dither(17, 26, '#DCD0FF', 0, 1)
    g.dither(33, 36, '#A98BFF', 0, 1)
    g.dither(44, 50, '#6B44F2', 0, .5)
    # Three standing dominoes and the first one already toppled flat. Each half is a
    # 7x7 face with pips on a 1/3/5 grid so no two pips touch.
    def pips(n):
        grid = {1: [(3, 3)], 2: [(1, 1), (5, 5)], 3: [(1, 1), (3, 3), (5, 5)],
                4: [(1, 1), (5, 1), (1, 5), (5, 5)], 5: [(1, 1), (5, 1), (3, 3), (1, 5), (5, 5)],
                6: [(1, 1), (5, 1), (1, 3), (5, 3), (1, 5), (5, 5)]}
        return grid[n]
    INK, FACE, SPLIT, SIDE = '#2A1680', '#FFFFFF', '#A98BFF', '#DCD0FF'
    for x, top, bot in [(23, 4, 2), (32, 6, 3), (41, 5, 1)]:
        y = 21
        g.rect(x - 1, y - 1, 9, 17, INK)
        g.rect(x, y, 7, 15, FACE)
        g.rect(x, y + 7, 7, 1, SPLIT)
        for px, py in pips(top):
            g.put(x + px, y + py, INK)
        for px, py in pips(bot):
            g.put(x + px, y + 8 + py, INK)
        g.rect(x + 6, y, 1, 15, SIDE)
    x, y = 3, 30
    g.rect(x - 1, y - 1, 17, 9, INK)
    g.rect(x, y, 15, 7, FACE)
    g.rect(x + 7, y, 1, 7, SPLIT)
    for px, py in pips(5):
        g.put(x + px, y + py, INK)
    for px, py in pips(2):
        g.put(x + 8 + px, y + py, INK)
    g.rect(x, y + 6, 15, 1, SIDE)
    # Motion ticks.
    for x, y in [(19, 27), (18, 30), (19, 33)]:
        g.rect(x, y, 2, 1, '#6B44F2')
    for x, y in [(6, 21), (14, 24), (46, 20)]:
        g.sprite(x, y, SPARK, {'w': '#A98BFF'})
    return g


def scene_chai():
    g = Grid()
    g.bands([(0, '#FFE3F1'), (28, '#FFC2EA')])
    g.dither(17, 28, '#FFC2EA', 0, 1)
    # Window with a lattice behind the glass.
    g.rect(4, 21, 11, 14, '#FFFFFF')
    g.rect(5, 22, 9, 12, '#BDEFFF')
    g.rect(9, 22, 1, 12, '#FFFFFF'); g.rect(5, 27, 9, 1, '#FFFFFF')
    g.rect(37, 22, 11, 12, '#FFFFFF')
    g.rect(38, 23, 9, 10, '#BDEFFF')
    g.rect(42, 23, 1, 10, '#FFFFFF'); g.rect(38, 28, 9, 1, '#FFFFFF')
    # Table.
    g.rect(0, 42, 52, 1, '#FFFFFF')
    g.rect(0, 43, 52, 4, '#FF7AD0')
    g.rect(0, 47, 52, 3, '#C24FE0')
    # Steam curls drifting up the sides.
    for x, y in [(19, 30), (31, 26)]:
        g.sprite(x, y, ['.w.', 'w..', '.w.', '..w', '.w.'], {'w': '#FFFFFF'})
    return g


def scene_bestie():
    g = Grid()
    g.bands([(0, '#BDEFFF'), (26, '#7FE6FF')])
    g.dither(17, 26, '#7FE6FF', 0, 1)
    g.dither(42, 50, '#BDEFFF', 0, .8)
    # Hearts float up from below the fist bump, clear of the trivia text above and
    # the fists across the middle.
    for x, y in [(6, 41), (16, 44), (30, 43), (41, 40)]:
        g.sprite(x, y, HEART, PAL)
    for x, y in [(24, 41), (48, 45), (2, 47)]:
        g.sprite(x, y, SPARK, PAL)
    return g


SCENES = {1: scene_cash, 2: scene_shop, 3: scene_month, 4: scene_streak, 5: scene_chai, 6: scene_bestie}


def write_scenes():
    d = os.path.join(OUT, 'scenes')
    os.makedirs(d, exist_ok=True)
    for n, make in SCENES.items():
        with open(os.path.join(d, f'scene{n}.svg'), 'w', encoding='utf-8') as fh:
            fh.write(make().svg())


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {'wordmark.svg': wordmark(), 'lockup.svg': lockup(), 'cover.svg': cover(), 'backdrop.svg': backdrop(),
             'preview.svg': preview(), 'corners.svg': corners(), 'paper.svg': paper(),
             'floor.svg': floor(), 'rings.svg': rings()}
    for name, svg in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
            fh.write(svg)
    write_scenes()
    print({k: len(v) for k, v in files.items()}, 'scenes:', len(SCENES))


if __name__ == '__main__':
    main()
