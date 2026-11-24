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


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {'wordmark.svg': wordmark(), 'lockup.svg': lockup(), 'cover.svg': cover(), 'backdrop.svg': backdrop(),
             'preview.svg': preview(), 'corners.svg': corners(), 'paper.svg': paper(),
             'floor.svg': floor(), 'rings.svg': rings()}
    for name, svg in files.items():
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
            fh.write(svg)
    print({k: len(v) for k, v in files.items()})


if __name__ == '__main__':
    main()
