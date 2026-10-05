"""
Builds assets/fonts/Silkscreen_{400Regular,700Bold}.ttf: Silkscreen plus a Hebrew
alphabet drawn on Silkscreen's own pixel grid.

Silkscreen ships Latin only, so Hebrew text fell back to the system face and lost
the pixel look. No published pixel font has Hebrew that matches it (Rubik Pixels
is dithered, Handjet is condensed), so the letters below are drawn by hand on the
same grid and merged into the two Silkscreen files. The family names stay the
same, so every `fontFamily: PIXEL` in the app picks Hebrew up with no other
change, including mixed Hebrew/English lines and TextInputs.

Grid, read off Silkscreen itself:
  * one pixel = 125 units (UPM 1000)
  * letters are 5 pixels tall, sitting on the baseline, 1 pixel of side bearing
    each side (advance = width + 2)
  * the bold face is the regular bitmap smeared one pixel right, advance + 1

Run from the repo root after editing a glyph:
    pip install fonttools
    python scripts/fonts/build_pixel_font.py
"""

from pathlib import Path

from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'node_modules' / '@expo-google-fonts' / 'silkscreen'
OUT = ROOT / 'assets' / 'fonts'

PX = 125
CAP_ROWS = 5  # rows 0..4 sit above the baseline; rows 5..6 descend below it

# Row 0 is the top of a capital. A glyph listed with top=-1 starts one row above
# cap height (lamed's ascender); rows past 4 hang below the baseline (finals, qof).
# The descenders are what keep the look-alike pairs apart: ן/ו, ך/ר, ף/פ, ץ/צ.
GLYPHS = {
    0x05D0: ['#..#',  # א alef
             '##.#',
             '.##.',
             '#.##',
             '#..#'],
    0x05D1: ['###.',  # ב bet -- base runs past the stem, unlike kaf
             '..#.',
             '..#.',
             '..#.',
             '####'],
    0x05D2: ['##.',   # ג gimel
             '.#.',
             '.#.',
             '.##',
             '#.#'],
    0x05D3: ['####',  # ד dalet -- roof runs past the stem, unlike resh
             '..#.',
             '..#.',
             '..#.',
             '..#.'],
    0x05D4: ['####',  # ה he -- left leg floats free of the roof
             '...#',
             '#..#',
             '#..#',
             '#..#'],
    0x05D5: ['##',    # ו vav
             '.#',
             '.#',
             '.#',
             '.#'],
    0x05D6: ['###',   # ז zayin
             '.#.',
             '.#.',
             '.#.',
             '.#.'],
    0x05D7: ['####',  # ח het
             '#..#',
             '#..#',
             '#..#',
             '#..#'],
    0x05D8: ['#.##',  # ט tet
             '#..#',
             '#..#',
             '#..#',
             '.##.'],
    0x05D9: ['##',    # י yod
             '.#',
             '.#'],
    0x05DA: ['###',   # ך final kaf
             '..#',
             '..#',
             '..#',
             '..#',
             '..#',
             '..#'],
    0x05DB: ['###.',  # כ kaf
             '...#',
             '...#',
             '...#',
             '###.'],
    0x05DC: ['#...',  # ל lamed -- one row of ascender
             '#...',
             '####',
             '...#',
             '..#.',
             '.#..'],
    0x05DD: ['####',  # ם final mem
             '#..#',
             '#..#',
             '#..#',
             '####'],
    0x05DE: ['#.##.',  # מ mem
             '.#..#',
             '.#..#',
             '.#..#',
             '.#.##'],
    0x05DF: ['##',    # ן final nun
             '.#',
             '.#',
             '.#',
             '.#',
             '.#',
             '.#'],
    0x05E0: ['##.',   # נ nun
             '..#',
             '..#',
             '..#',
             '###'],
    0x05E1: ['####',  # ס samekh
             '#..#',
             '#..#',
             '#..#',
             '.##.'],
    0x05E2: ['#..#',  # ע ayin
             '#..#',
             '.#.#',
             '..#.',
             '##..'],
    0x05E3: ['####',  # ף final pe
             '#..#',
             '##.#',
             '...#',
             '...#',
             '...#',
             '...#'],
    0x05E4: ['####',  # פ pe
             '#..#',
             '##.#',
             '...#',
             '####'],
    0x05E5: ['#.#',   # ץ final tsadi
             '#.#',
             '.##',
             '..#',
             '..#',
             '..#',
             '..#'],
    0x05E6: ['#..#',  # צ tsadi
             '.#.#',
             '..##',
             '...#',
             '####'],
    0x05E7: ['####',  # ק qof
             '...#',
             '#..#',
             '#.#.',
             '#...',
             '#...',
             '#...'],
    0x05E8: ['###.',  # ר resh
             '...#',
             '...#',
             '...#',
             '...#'],
    0x05E9: ['#.#.#',  # ש shin
             '#.#.#',
             '#.#.#',
             '#.#.#',
             '#####'],
    0x05EA: ['####',  # ת tav
             '.#.#',
             '.#.#',
             '.#.#',
             '##.#'],
    0x05BE: ['###'],  # ־ maqaf -- the Hebrew hyphen sits at the top
    0x05F3: ['#',     # ׳ geresh
             '#'],
    0x05F4: ['#.#',   # ״ gershayim
             '#.#'],
}

TOP_ROW = {0x05DC: -1}

# Smearing closes any one-pixel gap, which Latin survives (Silkscreen's counters
# are two pixels wide) but Hebrew does not: shin turned into a solid block and
# tet into samekh. These letters are drawn bold by hand with the gaps kept open.
BOLD_GLYPHS = {
    0x05D0: ['##..##', '###.##', '.####.', '##.###', '##..##'],              # א
    0x05D2: ['###.', '.##.', '.##.', '.###', '##.##'],                      # ג
    0x05D8: ['##.###', '##..##', '##..##', '##..##', '.####.'],              # ט
    0x05DE: ['##.###.', '.##..##', '.##..##', '.##..##', '.##.###'],         # מ
    0x05E2: ['##..##', '##..##', '.##.##', '..###.', '###...'],              # ע
    0x05E3: ['######', '##..##', '###.##', '....##', '....##', '....##', '....##'],  # ף
    0x05E4: ['######', '##..##', '###.##', '....##', '######'],              # פ
    0x05E5: ['##.##', '##.##', '.####', '...##', '...##', '...##', '...##'],  # ץ
    0x05E6: ['##..##', '.##.##', '..####', '....##', '######'],              # צ
    0x05E7: ['######', '....##', '##..##', '##.##.', '##....', '##....', '##....'],  # ק
    0x05E9: ['##.##.##', '##.##.##', '##.##.##', '##.##.##', '########'],    # ש
    0x05EA: ['######', '.##.##', '.##.##', '.##.##', '###.##'],              # ת
    0x05F4: ['##.##', '##.##'],                                             # ״
}


def embolden(rows):
    """Silkscreen's bold: every pixel also fills the one to its right."""
    out = []
    for row in rows:
        cells = row + '.'
        out.append(''.join(
            '#' if cells[i] == '#' or (i > 0 and cells[i - 1] == '#') else '.'
            for i in range(len(cells))
        ))
    return out


def outline(rows, top):
    """Trace the union of the lit pixels into closed TrueType contours.

    Each lit pixel contributes its four edges, clockwise; an edge shared with a
    lit neighbour cancels out. What survives is the boundary, chained into loops
    -- one clean outline per shape, with no interior seams for the rasterizer to
    show at small sizes.
    """
    lit = {(c, r) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == '#'}
    edges = {}
    for c, r in lit:
        # Grid corners in (x, y) pixel units, y up; this row's top edge is y0.
        y0 = CAP_ROWS - (r + top)
        x0, y1, x1 = c + 1, y0 - 1, c + 2  # +1: left side bearing
        for a, b in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)),
                     ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
            if (b, a) in edges:
                del edges[(b, a)]
            else:
                edges[(a, b)] = True

    nexts = {}
    for a, b in edges:
        nexts.setdefault(a, []).append(b)

    contours = []
    while nexts:
        start = next(iter(nexts))
        loop, point = [start], start
        while True:
            options = nexts[point]
            # At a corner where two shapes touch diagonally, turn right so each
            # shape closes on its own instead of figure-eighting into the other.
            if len(options) > 1 and len(loop) > 1:
                px, py = loop[-2]
                dx, dy = point[0] - px, point[1] - py
                right = (point[0] + dy, point[1] - dx)
                nxt = right if right in options else options[0]
            else:
                nxt = options[0]
            options.remove(nxt)
            if not options:
                del nexts[point]
            if nxt == start:
                break
            loop.append(nxt)
            point = nxt
        contours.append(drop_collinear(loop))
    return contours


def drop_collinear(loop):
    kept = []
    n = len(loop)
    for i, (x, y) in enumerate(loop):
        px, py = loop[i - 1]
        nx, ny = loop[(i + 1) % n]
        if (x - px) * (ny - y) != (y - py) * (nx - x):
            kept.append((x, y))
    return kept


def build(face, bold):
    font = TTFont(SRC / face / f'Silkscreen_{face}.ttf')
    glyf, hmtx = font['glyf'], font['hmtx']
    order = font.getGlyphOrder()
    cmap_add = {}

    for code, rows in GLYPHS.items():
        if bold:
            rows = BOLD_GLYPHS.get(code) or embolden(rows)
        name = f'uni{code:04X}'
        pen = TTGlyphPen(None)
        for contour in outline(rows, TOP_ROW.get(code, 0)):
            pen.moveTo((contour[0][0] * PX, contour[0][1] * PX))
            for x, y in contour[1:]:
                pen.lineTo((x * PX, y * PX))
            pen.closePath()
        glyph = pen.glyph()
        glyph.recalcBounds(glyf)
        glyf[name] = glyph
        width = max(len(r) for r in rows)
        hmtx[name] = ((width + 2) * PX, glyph.xMin)
        if name not in order:
            order.append(name)
        cmap_add[code] = name

    font.setGlyphOrder(order)
    for table in font['cmap'].tables:
        if table.isUnicode():
            table.cmap.update(cmap_add)

    OUT.mkdir(parents=True, exist_ok=True)
    font.save(OUT / f'Silkscreen_{face}.ttf')
    print(f'wrote assets/fonts/Silkscreen_{face}.ttf (+{len(cmap_add)} Hebrew glyphs)')


if __name__ == '__main__':
    build('400Regular', bold=False)
    build('700Bold', bold=True)
