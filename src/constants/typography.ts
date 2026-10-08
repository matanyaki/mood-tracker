import type { TextStyle } from 'react-native';
import { INK, INK_MUTED } from './pixel';

/**
 * Silkscreen is the app's only typeface -- every screen, card, label and input
 * draws with it, so the pixel-art look never drifts between screens.
 *
 * Import PIXEL / PIXEL_BOLD from here instead of declaring a font constant per
 * file (the cards each used to carry their own `MONO`, which is how they drifted
 * apart in the first place).
 *
 * The faces are registered in App.tsx via `useFonts(PIXEL_FONTS)`; text styled
 * with a family that has not finished loading renders blank on Android, so the
 * app holds its first frame until they are ready.
 *
 * Sizing note: Silkscreen is wide -- ~0.66em per character regular, ~0.76em bold,
 * against ~0.5em for a system sans -- so a label needs roughly 30% more room here
 * than it did in the old system/monospace face. Sizes are tuned down to suit.
 *
 * Hebrew: stock Silkscreen is Latin-only, so Hebrew fell back to the system face.
 * The files loaded here are Silkscreen with a Hebrew alphabet drawn on the same
 * pixel grid, built by scripts/fonts/build_pixel_font.py -- edit glyphs there and
 * rebuild, never by hand. Same family names, so nothing else had to change.
 */
export const PIXEL_FONTS = {
    Silkscreen_400Regular: require('../../assets/fonts/Silkscreen_400Regular.ttf'),
    Silkscreen_700Bold: require('../../assets/fonts/Silkscreen_700Bold.ttf'),
};

/** Regular face: body copy, inputs, anything longer than a few words. */
export const PIXEL = 'Silkscreen_400Regular';

/**
 * Bold face. Android will not pick a bold weight out of a single-file custom
 * family -- `fontWeight: '700'` either does nothing or gets faked by smearing the
 * glyphs, which wrecks the pixel grid. Bold text names this file instead of
 * setting a weight.
 */
export const PIXEL_BOLD = 'Silkscreen_700Bold';

/**
 * Silkscreen ships Latin plus basic punctuation only. The geometric ornaments the
 * cards used to decorate with have no glyph in it and render as tofu boxes:
 *   U+25A0 (block), U+25C6 (diamond), U+2713 (check), U+2192 (arrow).
 * Square brackets, `*`, `>` and U+2022 (bullet) are all present -- use those.
 *
 * `*` rather than U+2022 because this marker is typed into the note's text, where
 * it can only be as big as the surrounding font: Silkscreen draws its bullet as a
 * single dot 0.125em square (2x2px at 16px), while `*` fills 0.625em (10x10px).
 * A marker rendered on its own -- like the one in DayEntryModal -- should be drawn
 * as a View block instead, which no glyph can match.
 */
export const PIXEL_BULLET = '* ';

/**
 * The type scale. Every text style starts from one of these and only overrides
 * colour or alignment -- never size.
 *
 * 12 is the floor. Silkscreen draws caps at ~0.62em, so 12 here already reads
 * smaller than 12 in a system face. With that floor, h2 / caption / label share a
 * size and are told apart the way the app always has: bold vs regular, the
 * `[ BRACKETS ]`, tracking and colour.
 *
 * Two places keep their own documented sizes because their geometry depends on
 * them: the ruled note fields (14 on a 30px line) and the calendar month title.
 */
export const TYPE = {
    /** Screen title. AppHeader only -- one per screen. */
    h1: { fontFamily: PIXEL_BOLD, fontSize: 18, lineHeight: 24, letterSpacing: 2, color: INK },
    /** Section heading outside a card: `[ ACCOUNT ]`. */
    h2: { fontFamily: PIXEL_BOLD, fontSize: 12, lineHeight: 16, letterSpacing: 2, color: INK_MUTED },
    /** Card and dialog titles; primary button text. */
    h3: { fontFamily: PIXEL_BOLD, fontSize: 14, lineHeight: 20, letterSpacing: 2, color: INK },
    /** Running text: answers, tips, messages. */
    body: { fontFamily: PIXEL, fontSize: 12, lineHeight: 18, letterSpacing: 0.5, color: INK_MUTED },
    /** Text the user wrote or reads closely: inputs, the quote, notes. */
    bodyLg: { fontFamily: PIXEL, fontSize: 14, lineHeight: 22, letterSpacing: 0, color: INK },
    /** Meta: timestamps, subtitles, counts. */
    caption: { fontFamily: PIXEL, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: INK_MUTED },
    /** Buttons, chips, tags, menu rows, eyebrows inside a card. */
    label: { fontFamily: PIXEL_BOLD, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: INK },
    /** Big numbers. */
    stat: { fontFamily: PIXEL_BOLD, fontSize: 26, lineHeight: 32, letterSpacing: 0, color: INK },
} satisfies Record<string, TextStyle>;

/**
 * Cap on system font scaling for a single line that lives in a fixed box -- a tab
 * label, a weekday toggle, a streak tile. Text still grows, just not out of its box.
 */
export const TIGHT_FONT_SCALE = 1.3;
