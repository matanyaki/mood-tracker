import { Silkscreen_400Regular, Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';

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
 */
export const PIXEL_FONTS = {
    Silkscreen_400Regular,
    Silkscreen_700Bold,
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
 * Square brackets, `*`, `>` and U+2022 (bullet, below) are all present -- use those.
 */
export const PIXEL_BULLET = '• ';
