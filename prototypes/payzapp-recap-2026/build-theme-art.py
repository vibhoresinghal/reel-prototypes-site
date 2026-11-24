"""Generate the PayZapp Recap 2026 theme artwork.

Run from this folder:  python build-theme-art.py
Writes assets/themes/<theme>/{wordmark,lockup,cover,backdrop,preview}.svg

Every file is standalone (no CSS variables, no external references) so it
renders the same in <img>, in html2canvas share cards, and when opened alone.
The "recap 2026" wordmark reuses the original 2025 glyph outlines; the final
"5" is clipped away and a matching rounded "6" is drawn in its place.
"""
import json
import math
import os
import random
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
GLYPHS = json.load(open(os.path.join(HERE, 'wordmark-data.json')))
TILE = re.sub(r'^<svg[^>]*>|</svg>$', '', open(os.path.join(ASSETS, 'pz-tile.svg')).read())
RINGS = re.sub(r'<\?xml[^>]*>', '', open(os.path.join(ASSETS, 'flipbook-rings.svg')).read())

# The "6": a closed bowl plus a curved ascender, stroked to match the weight
# and rounded terminals of the original numerals (glyph box x 101.6-131.7).
SIX = ('M107.4 56.6a9.7 9 0 1 0 19.4 0a9.7 9 0 1 0 -19.4 0'
       'M107.4 56.6C107.4 44.2 111.6 37.4 119.4 37.4H125.4')

THEMES = {
    'christmas': {
        'recap': '#FFE6A8', 'year': '#FFFFFF', 'shadow': '#7A1426',
        'sky': ['#7E1626', '#B8303A', '#E8774A', '#F7C27A'],
    },
    'aurora': {
        'recap': '#B6F7DA', 'year': '#FFFFFF', 'shadow': '#1B2160',
        'sky': ['#0A1238', '#14306A', '#1C5A7A', '#2A8B86'],
    },
    'city': {
        'recap': '#FFD98A', 'year': '#FFFFFF', 'shadow': '#4A1A5E',
        'sky': ['#24124A', '#5B2470', '#C2486A', '#F59A62'],
    },
}


def wordmark_body(t, uid):
    """Glyph group in the 140x76 wordmark coordinate space."""
    return f'''<defs>
<clipPath id="{uid}-clip"><rect x="0" y="0" width="101.6" height="80"/></clipPath>
<filter id="{uid}-shadow" x="-10%" y="-10%" width="125%" height="135%" color-interpolation-filters="sRGB">
<feDropShadow dx="2.1" dy="2.9" stdDeviation="0" flood-color="{t['shadow']}" flood-opacity="1"/></filter>
</defs>
<g filter="url(#{uid}-shadow)" fill="{t['year']}">
<path d="{GLYPHS['two']}"/>
<path d="{GLYPHS['twofive']}" clip-path="url(#{uid}-clip)"/>
<path d="{GLYPHS['ring']}"/>
<path d="{GLYPHS['ringStroke']}" fill="none" stroke="{t['year']}" stroke-width="1.927" stroke-linejoin="bevel"/>
<path d="{SIX}" fill="none" stroke="{t['year']}" stroke-width="8.6" stroke-linecap="round"/>
</g>
<g filter="url(#{uid}-shadow)"><path d="{GLYPHS['recap']}" fill="{t['recap']}"/></g>'''


def wordmark(t):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="76" viewBox="0 0 140 79" fill="none" '
            'role="img" aria-label="recap 2026">' + wordmark_body(t, 'wm') + '</svg>')


def lockup(t):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="156" viewBox="0 0 140 156" fill="none" '
            'role="img" aria-label="PayZapp recap 2026">' + TILE +
            '<g transform="translate(0 78.2)">' + wordmark_body(t, 'lk') + '</g></svg>')


# ---------------------------------------------------------------- shapes

def pine(x, base, h, fill, snow=None, tiers=3):
    """Stacked-triangle pine. Returns svg string."""
    w = h * 0.62
    out = [f'<rect x="{x - h*0.035:.1f}" y="{base - h*0.1:.1f}" width="{h*0.07:.1f}" height="{h*0.12:.1f}" fill="{fill}"/>']
    for i in range(tiers):
        top = base - h + i * h * 0.24
        bot = base - h * 0.08 - (tiers - 1 - i) * h * 0.2
        half = w / 2 * (0.62 + 0.38 * (i + 1) / tiers)
        out.append(f'<path d="M{x:.1f} {top:.1f}L{x+half:.1f} {bot:.1f}Q{x:.1f} {bot+h*0.05:.1f} {x-half:.1f} {bot:.1f}Z" fill="{fill}"/>')
        if snow:
            sh = h * 0.09
            out.append(f'<path d="M{x:.1f} {top:.1f}L{x+half*0.42:.1f} {top+sh*1.6:.1f}Q{x+half*0.2:.1f} {top+sh*1.2:.1f} {x:.1f} {top+sh*1.9:.1f}'
                       f'Q{x-half*0.2:.1f} {top+sh*1.2:.1f} {x-half*0.42:.1f} {top+sh*1.6:.1f}Z" fill="{snow}"/>')
    return ''.join(out)


def stars(rng, n, x0, y0, x1, y1, color='#fff', rmax=1.6, opacity=(0.35, 0.95)):
    out = []
    for _ in range(n):
        x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
        r = rng.uniform(0.5, rmax)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="{color}" opacity="{rng.uniform(*opacity):.2f}"/>')
    return ''.join(out)


def sparkle(x, y, s, fill, opacity=1):
    return (f'<path d="M{x} {y-s}Q{x+s*0.18} {y-s*0.18} {x+s} {y}Q{x+s*0.18} {y+s*0.18} {x} {y+s}'
            f'Q{x-s*0.18} {y+s*0.18} {x-s} {y}Q{x-s*0.18} {y-s*0.18} {x} {y-s}Z" fill="{fill}" opacity="{opacity}"/>')


def firework(cx, cy, r, color, rays=14, width=2.4, opacity=0.9):
    out = [f'<g opacity="{opacity}" stroke="{color}" stroke-width="{width}" stroke-linecap="round">']
    for i in range(rays):
        a = 2 * math.pi * i / rays
        r0 = r * 0.35
        out.append(f'<line x1="{cx + math.cos(a)*r0:.1f}" y1="{cy + math.sin(a)*r0:.1f}" '
                   f'x2="{cx + math.cos(a)*r:.1f}" y2="{cy + math.sin(a)*r:.1f}"/>')
    out.append('</g>')
    for i in range(rays):
        a = 2 * math.pi * (i + 0.5) / rays
        out.append(f'<circle cx="{cx + math.cos(a)*r*1.12:.1f}" cy="{cy + math.sin(a)*r*1.12:.1f}" r="{width*0.7:.1f}" fill="{color}" opacity="{opacity*0.8:.2f}"/>')
    return ''.join(out)


def sky_gradient(gid, stops, x2='0', y2='1'):
    n = len(stops) - 1
    s = ''.join(f'<stop offset="{i/n:.2f}" stop-color="{c}"/>' for i, c in enumerate(stops))
    return f'<linearGradient id="{gid}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def string_lights(rng, x0, y0, x1, y1, sag, n, colors, wire='#2b1a14', r=4.2):
    """A sagging wire with glowing bulbs (quadratic curve)."""
    cx, cy = (x0 + x1) / 2, max(y0, y1) + sag
    out = [f'<path d="M{x0} {y0}Q{cx} {cy} {x1} {y1}" stroke="{wire}" stroke-width="1.6" fill="none" opacity=".8"/>']
    for i in range(1, n):
        t = i / n
        x = (1-t)**2*x0 + 2*(1-t)*t*cx + t**2*x1
        y = (1-t)**2*y0 + 2*(1-t)*t*cy + t**2*y1
        c = colors[i % len(colors)]
        out.append(f'<circle cx="{x:.1f}" cy="{y+5:.1f}" r="{r*2.4:.1f}" fill="{c}" opacity=".22"/>'
                   f'<ellipse cx="{x:.1f}" cy="{y+5:.1f}" rx="{r*0.8:.1f}" ry="{r:.1f}" fill="{c}"/>')
    return ''.join(out)


# ---------------------------------------------------------------- covers (540x600)

def cover_christmas():
    rng = random.Random(7)
    t = THEMES['christmas']
    parts = ['<defs>', sky_gradient('sky', t['sky']),
             '<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".85"/>'
             '<stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient>',
             '<linearGradient id="snowA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE9F5"/></linearGradient>',
             '<linearGradient id="snowB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F8FD"/><stop offset="1" stop-color="#C9DCEE"/></linearGradient>',
             '</defs>',
             '<rect width="540" height="600" fill="url(#sky)"/>']
    # Lights strung across the top corners, kept clear of the wordmark.
    parts.append(string_lights(rng, -10, 18, 150, 30, 26, 6, ['#FFD36B', '#FF6B6B', '#7FE0B0', '#FFFFFF']))
    parts.append(string_lights(rng, 390, 30, 550, 18, 26, 6, ['#FFFFFF', '#7FE0B0', '#FF6B6B', '#FFD36B']))
    parts.append(stars(rng, 26, 0, 40, 540, 330, '#FFF6DA', 1.5, (0.25, 0.7)))
    # Distant hills and a row of small pines.
    parts.append('<path d="M0 468C80 440 150 450 230 462C320 476 400 440 540 452V600H0Z" fill="url(#snowB)" opacity=".95"/>')
    for x, h in [(150, 50), (182, 38), (360, 44), (392, 36)]:
        parts.append(pine(x, 466, h, '#1F5C47', '#F4F9FF', 3))
    # Warm glow and the hero tree, set to the right of the wordmark.
    tx, tb, th = 462, 548, 214
    parts.append(f'<ellipse cx="{tx}" cy="{tb-90}" rx="130" ry="130" fill="url(#glow)"/>')
    parts.append(pine(tx, tb, th, '#1E6B4C', None, 4))
    for y0, sag in [(tb-150, 8), (tb-104, 10), (tb-58, 12)]:
        span = (y0 - (tb - th)) * 0.6
        parts.append(f'<path d="M{tx-span:.0f} {y0}Q{tx} {y0+16+sag} {tx+span:.0f} {y0+12}" stroke="#F6C453" stroke-width="3" fill="none" stroke-linecap="round"/>')
    for dx, dy, c in [(-18, -150, '#E2384D'), (20, -128, '#F6C453'), (-30, -100, '#F6C453'), (14, -86, '#E2384D'),
                      (40, -52, '#FFFFFF'), (-44, -46, '#E2384D'), (0, -36, '#F6C453'), (-12, -120, '#FFFFFF')]:
        parts.append(f'<circle cx="{tx+dx}" cy="{tb+dy}" r="6.5" fill="{c}"/><circle cx="{tx+dx-2}" cy="{tb+dy-2}" r="2" fill="#fff" opacity=".7"/>')
    parts.append(sparkle(tx, tb - th + 2, 20, '#FFD75E'))
    parts.append(f'<circle cx="{tx}" cy="{tb-th+2}" r="30" fill="#FFE79A" opacity=".25"/>')
    # A second, smaller tree and a snowman on the left.
    parts.append(pine(70, 540, 150, '#195A40', '#F4F9FF', 4))
    parts.append('<g transform="translate(130 0)"><circle cx="0" cy="522" r="22" fill="#FFFFFF"/><circle cx="0" cy="486" r="15" fill="#FFFFFF"/>'
                 '<circle cx="-5" cy="482" r="2" fill="#2B2B2B"/><circle cx="5" cy="482" r="2" fill="#2B2B2B"/>'
                 '<path d="M0 487l10 3-10 2z" fill="#F08A3C"/><path d="M-14 496h28v7h-28z" fill="#E2384D"/><path d="M6 500h7v18h-7z" fill="#E2384D"/>'
                 '<path d="M-12 474h24v-4h-6v-14h-12v14h-6z" fill="#2B2B2B"/></g>')
    # Gifts under the hero tree
    for x, w, h, c, rb in [(384, 40, 32, '#E2384D', '#F6C453'), (420, 30, 24, '#F6C453', '#E2384D'),
                           (500, 34, 28, '#2E7FBF', '#FFFFFF')]:
        y = 560 - h
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{c}"/>'
                     f'<rect x="{x + w/2 - 3:.1f}" y="{y}" width="6" height="{h}" fill="{rb}"/>'
                     f'<rect x="{x}" y="{y + h*0.35:.1f}" width="{w}" height="5" fill="{rb}"/>'
                     f'<path d="M{x+w/2:.1f} {y}c-8-10-16-6-10 0zM{x+w/2:.1f} {y}c8-10 16-6 10 0z" fill="{rb}"/>')
    # Foreground drifts.
    parts.append('<path d="M0 548C90 530 170 540 270 552C370 564 450 540 540 546V600H0Z" fill="url(#snowA)"/>')
    parts.append(stars(rng, 40, 0, 330, 540, 600, '#FFFFFF', 2.2, (0.5, 0.95)))
    return parts


def cover_aurora():
    rng = random.Random(11)
    t = THEMES['aurora']
    parts = ['<defs>', sky_gradient('sky', t['sky']),
             '<filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>',
             '<linearGradient id="ribA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CF5C4" stop-opacity="0"/>'
             '<stop offset=".55" stop-color="#7CF5C4" stop-opacity=".85"/><stop offset="1" stop-color="#3FD3A3" stop-opacity=".1"/></linearGradient>',
             '<linearGradient id="ribB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E58AD8" stop-opacity="0"/>'
             '<stop offset=".6" stop-color="#E58AD8" stop-opacity=".6"/><stop offset="1" stop-color="#8A7CF5" stop-opacity="0"/></linearGradient>',
             '<linearGradient id="snowcap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9F4FF"/><stop offset="1" stop-color="#9CB8DA"/></linearGradient>',
             '</defs>',
             '<rect width="540" height="600" fill="url(#sky)"/>']
    parts.append(stars(rng, 90, 0, 0, 540, 470, '#FFFFFF', 1.7))
    parts.append(sparkle(78, 92, 7, '#FFFFFF', .9) + sparkle(470, 150, 6, '#FFFFFF', .8) + sparkle(420, 60, 4, '#FFFFFF', .7))
    # Aurora curtains: wide blurred ribbons.
    parts.append('<g filter="url(#blur)">'
                 '<path d="M-40 250C60 170 150 300 250 220C340 150 430 260 580 170L580 330C430 410 340 300 250 370C150 440 60 320 -40 390Z" fill="url(#ribA)"/>'
                 '<path d="M-40 150C80 90 170 200 290 130C390 75 470 160 580 110L580 230C470 270 390 190 290 250C170 320 80 210 -40 270Z" fill="url(#ribB)"/>'
                 '</g>')
    # Fine vertical rays inside the green curtain.
    for i in range(40):
        x = i * 14 + rng.uniform(-3, 3)
        top = 230 + 40 * math.sin(i / 3.2) - rng.uniform(10, 50)
        parts.append(f'<line x1="{x:.1f}" y1="{top:.1f}" x2="{x:.1f}" y2="{top + rng.uniform(70, 130):.1f}" stroke="#A8FFE0" stroke-width="2" opacity="{rng.uniform(.08, .22):.2f}"/>')
    # Mountains
    parts.append('<path d="M0 470L70 405L120 432L200 352L262 412L300 388L370 448L440 380L540 445V600H0Z" fill="#1B3466"/>')
    parts.append('<path d="M200 352L222 378L210 380L230 396L245 395L262 412L232 400L218 404L200 386L185 398L178 390Z" fill="url(#snowcap)" opacity=".9"/>'
                 '<path d="M440 380L460 402L448 404L468 418L480 412L496 426L470 424L452 410L436 418L426 400Z" fill="url(#snowcap)" opacity=".85"/>'
                 '<path d="M70 405L86 422L76 424L92 434L80 432L64 420Z" fill="url(#snowcap)" opacity=".8"/>')
    parts.append('<path d="M0 520C60 488 120 470 190 488C260 506 330 470 400 482C460 492 500 480 540 470V600H0Z" fill="#12244C"/>')
    # Pine line and a small cabin with a warm window.
    for x in range(-8, 560, 18):
        h = rng.uniform(34, 58)
        parts.append(pine(x + rng.uniform(-4, 4), 540 + rng.uniform(-6, 6), h, '#0A1736', None, 3))
    parts.append('<g transform="translate(446 490)"><path d="M0 22L26 2L52 22V48H0Z" fill="#0A1736"/>'
                 '<path d="M-4 24L26 0L56 24" stroke="#DCEBFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>'
                 '<rect x="10" y="26" width="12" height="11" rx="1.5" fill="#FFC86B"/><rect x="30" y="26" width="12" height="11" rx="1.5" fill="#FFC86B"/>'
                 '<circle cx="26" cy="31" r="34" fill="#FFC86B" opacity=".10"/></g>')
    parts.append('<path d="M0 560C120 545 220 556 300 566C390 576 470 556 540 552V600H0Z" fill="#E6F0FB"/>'
                 '<path d="M0 578C140 566 260 574 360 584C440 590 500 580 540 576V600H0Z" fill="#C5D7EE"/>')
    return parts


def skyline(rng, base, x0, x1, hmin, hmax, fill, window, density=0.35, wmin=26, wmax=58, seed_windows=True):
    out = []
    x = x0
    while x < x1:
        w = rng.uniform(wmin, wmax)
        h = rng.uniform(hmin, hmax)
        top = base - h
        roof = rng.random()
        if roof < 0.18:
            out.append(f'<path d="M{x:.1f} {top:.1f}L{x+w/2:.1f} {top-h*0.16:.1f}L{x+w:.1f} {top:.1f}V{base}H{x:.1f}Z" fill="{fill}"/>')
        elif roof < 0.32:
            out.append(f'<rect x="{x+w/2-1.2:.1f}" y="{top-h*0.22:.1f}" width="2.4" height="{h*0.22:.1f}" fill="{fill}"/>'
                       f'<circle cx="{x+w/2:.1f}" cy="{top-h*0.22:.1f}" r="2.4" fill="#FF6B6B"/>')
            out.append(f'<rect x="{x:.1f}" y="{top:.1f}" width="{w:.1f}" height="{base-top:.1f}" fill="{fill}"/>')
        elif roof < 0.42:
            out.append(f'<path d="M{x:.1f} {top+w*0.3:.1f}A{w/2:.1f} {w*0.42:.1f} 0 0 1 {x+w:.1f} {top+w*0.3:.1f}V{base}H{x:.1f}Z" fill="{fill}"/>')
        else:
            out.append(f'<rect x="{x:.1f}" y="{top:.1f}" width="{w:.1f}" height="{base-top:.1f}" fill="{fill}"/>')
        if seed_windows and window:
            cols = max(1, int((w - 8) // 9))
            rows = int((base - top - 12) // 12)
            for r in range(rows):
                for c in range(cols):
                    if rng.random() < density:
                        wx = x + 6 + c * 9
                        wy = top + 8 + r * 12
                        out.append(f'<rect x="{wx:.1f}" y="{wy:.1f}" width="4.5" height="6" fill="{window}" opacity="{rng.uniform(.55, 1):.2f}"/>')
        x += w + rng.uniform(0, 4)
    return ''.join(out)


def cover_city():
    rng = random.Random(23)
    t = THEMES['city']
    parts = ['<defs>', sky_gradient('sky', t['sky']),
             '<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE0A3" stop-opacity=".95"/>'
             '<stop offset=".45" stop-color="#FFB877" stop-opacity=".45"/><stop offset="1" stop-color="#FF9A6B" stop-opacity="0"/></radialGradient>',
             '<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1C55"/><stop offset="1" stop-color="#1A0E30"/></linearGradient>',
             '</defs>',
             '<rect width="540" height="600" fill="url(#sky)"/>']
    parts.append(stars(rng, 40, 0, 0, 540, 260, '#FFFFFF', 1.4, (0.2, 0.7)))
    parts.append('<circle cx="270" cy="470" r="150" fill="url(#sun)"/>')
    # Fireworks around the edges so the wordmark stays readable.
    parts.append(firework(70, 120, 42, '#FFD36B', 16, 2.6, .9))
    parts.append(firework(470, 90, 34, '#FF8FB1', 14, 2.4, .85))
    parts.append(firework(490, 250, 24, '#8FE3FF', 12, 2, .75))
    parts.append(firework(40, 290, 20, '#FF8FB1', 12, 1.8, .7))
    parts.append(sparkle(140, 60, 6, '#FFFFFF', .9) + sparkle(400, 200, 5, '#FFE6A8', .8))
    # Back skyline (haze) and front skyline with lit windows.
    parts.append(skyline(rng, 500, -10, 560, 90, 190, '#7A3474', None, 0, 30, 64, False).replace('fill="#7A3474"', 'fill="#7A3474" opacity=".75"'))
    parts.append(skyline(rng, 520, -10, 560, 60, 150, '#2E1442', '#FFD37A', 0.32))
    # Bunting lights across the street.
    parts.append(string_lights(rng, -10, 16, 160, 30, 24, 6, ['#FFD36B', '#FF8FB1', '#FFFFFF', '#8FE3FF'], '#1a0e2a', 3.6))
    parts.append(string_lights(rng, 380, 30, 550, 16, 24, 6, ['#8FE3FF', '#FFFFFF', '#FF8FB1', '#FFD36B'], '#1a0e2a', 3.6))
    # River reflections.
    parts.append('<rect y="520" width="540" height="80" fill="url(#water)"/>')
    for i in range(46):
        x = rng.uniform(0, 540)
        y = rng.uniform(528, 594)
        c = rng.choice(['#FFD37A', '#FF8FB1', '#FFB877'])
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{rng.uniform(8, 26):.1f}" height="2" rx="1" fill="{c}" opacity="{rng.uniform(.25, .7):.2f}"/>')
    # Diyas on the embankment.
    for x in (60, 150, 390, 480):
        parts.append(f'<g transform="translate({x} 520)"><circle cy="-10" r="14" fill="#FFB347" opacity=".25"/>'
                     f'<path d="M-9 -2Q0 6 9 -2L7 -6H-7Z" fill="#E8743B"/><path d="M0 -15Q4 -9 0 -6Q-4 -9 0 -15Z" fill="#FFE08A"/></g>')
    return parts


COVERS = {'christmas': cover_christmas, 'aurora': cover_aurora, 'city': cover_city}


def cover(theme):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="540" height="600" viewBox="0 0 540 600" '
            'preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + ''.join(COVERS[theme]()) + '</svg>')


# ---------------------------------------------------------------- page backdrops (720x260, bottom-anchored)
# Translucent black/white so they sit on whatever card colour the page shows.

def backdrop(theme):
    rng = random.Random(5)
    p = []
    if theme == 'christmas':
        p.append('<path d="M0 200C120 170 230 186 360 196C490 206 600 168 720 182V260H0Z" fill="#FFFFFF" opacity=".10"/>')
        for x in range(10, 720, 46):
            h = rng.uniform(46, 92)
            p.append(pine(x + rng.uniform(-10, 10), 214, h, '#000000', None, 3).replace('fill="#000000"', 'fill="#000" fill-opacity=".22"'))
        p.append('<path d="M0 226C140 208 260 220 380 230C500 240 610 214 720 218V260H0Z" fill="#FFFFFF" opacity=".16"/>')
        for i in range(18):
            x = 20 + i * 40 + rng.uniform(-8, 8)
            p.append(f'<circle cx="{x:.1f}" cy="{rng.uniform(150, 205):.1f}" r="2.2" fill="{rng.choice(["#FFD36B", "#FF8080", "#9BF0C4"])}" opacity=".7"/>')
    elif theme == 'aurora':
        p.append('<path d="M0 170L90 110L150 140L250 70L330 130L380 104L470 160L560 96L650 150L720 120V260H0Z" fill="#000" fill-opacity=".20"/>')
        p.append('<path d="M0 214C90 190 170 182 260 196C350 210 450 180 540 188C620 196 680 186 720 180V260H0Z" fill="#000" fill-opacity=".22"/>')
        for x in range(-6, 730, 15):
            p.append(pine(x + rng.uniform(-3, 3), 226 + rng.uniform(-6, 6), rng.uniform(26, 46), '#000', None, 3).replace('fill="#000"', 'fill="#000" fill-opacity=".18"'))
    else:
        p.append(skyline(rng, 260, -10, 730, 70, 170, '#000', None, 0, 30, 66, False).replace('fill="#000"', 'fill="#000" fill-opacity=".16"'))
        p.append(skyline(rng, 260, -10, 730, 40, 120, '#000', '#FFD37A', 0.22, 26, 56).replace('fill="#000"', 'fill="#000" fill-opacity=".22"'))
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="260" viewBox="0 0 720 260" '
            'preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + ''.join(p) + '</svg>')


# ---------------------------------------------------------------- flipbook preview (share cards, error screen)

def preview(theme):
    t = THEMES[theme]
    art = ''.join(COVERS[theme]()).replace('id="', f'id="pv-').replace('url(#', 'url(#pv-')
    rings = re.sub(r'<svg[^>]*>', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" x="52" y="0" width="436" height="56.6" viewBox="0 0 262 34" fill="none">', RINGS, count=1)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="540" height="676" viewBox="0 0 540 676" role="img" aria-label="PayZapp recap 2026 flipbook">
<defs><clipPath id="pv-card"><rect x="0" y="22" width="540" height="654" rx="34"/></clipPath>
<linearGradient id="pv-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
<g clip-path="url(#pv-card)"><rect x="0" y="22" width="540" height="654" fill="{t['sky'][0]}"/>
<g transform="translate(0 76)">{art}</g>
<rect x="0" y="22" width="540" height="98" fill="url(#pv-fade)"/>
<rect x="0" y="118" width="540" height="3" fill="#000" opacity=".12"/></g>
{rings}
<g transform="translate(130 150) scale(2)">{TILE}<g transform="translate(0 78.2)">{wordmark_body(t, 'pv-wm')}</g></g>
</svg>'''


def main():
    for theme in THEMES:
        d = os.path.join(ASSETS, 'themes', theme)
        os.makedirs(d, exist_ok=True)
        files = {'wordmark.svg': wordmark(THEMES[theme]), 'lockup.svg': lockup(THEMES[theme]),
                 'cover.svg': cover(theme), 'backdrop.svg': backdrop(theme), 'preview.svg': preview(theme)}
        for name, svg in files.items():
            with open(os.path.join(d, name), 'w', encoding='utf-8') as fh:
                fh.write(svg)
        print(theme, {k: len(v) for k, v in files.items()})


if __name__ == '__main__':
    main()
