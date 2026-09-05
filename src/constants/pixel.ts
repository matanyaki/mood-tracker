/**
 * Pixel-art drawing primitives.
 *
 * The look is built from four rules, and every one of them is about removing
 * softness -- a pixel-art surface has no sub-pixel detail to spend on gradients:
 *
 *   1. Flat outline. A thick, fully opaque border, never a hairline.
 *   2. Hard shadow. A solid block offset by whole pixels, no blur and no alpha
 *      ramp -- `shadowRadius` / `elevation` are the enemy here, so surfaces that
 *      go pixel drop them entirely and render a sibling <View> instead.
 *   3. Square corners. Radius 0, or a small one that still lands on the grid.
 *   4. Whole-pixel offsets. Every translate is an integer so edges stay crisp.
 *
 * These live here rather than as per-file consts because that is exactly how the
 * typefaces drifted apart before `typography.ts` centralised them -- see the note
 * there. Components already written against their own local palette (IntentionCard,
 * GratitudeNote, FabMenu) keep it; new pixel surfaces should import from here.
 */

/** Outline and hard-shadow colour. Black, so it reads as ink on any background. */
export const OUTLINE = '#64748B';

/** Primary dark used for filled surfaces -- matches the app's existing navy. */
export const INK = '#1A1A2E';

/** Opaque card surface. Slightly warm so it does not glare against the bg image. */
export const PAPER = '#FFFDF8';

/** Muted ink for secondary copy that still has to hold against PAPER. */
export const INK_MUTED = '#64748B';

/**
 * Hard-shadow displacement, in px. Also the distance a pressable travels when it
 * is pushed in: a pixel button sinks *onto* its own shadow, so the two values
 * have to be the same one or the face lands off the block.
 */
export const SHADOW_OFFSET = 4;

/** Outline weight for a card or a button. */
export const BORDER_W = 3;

/** Outline weight for a control nested inside an already-outlined surface. */
export const BORDER_W_INNER = 2;

/** Width of the colour bar down the left edge of a card. */
export const ACCENT_BAR_W = 10;
