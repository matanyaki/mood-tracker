/**
 * The spacing scale. Every margin, padding and gap in the app is one of these --
 * a 4/8 grid, so nothing lands a few pixels off its neighbour.
 */
export const SPACE = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

/** Left and right padding of every screen, header included. One shared edge. */
export const SCREEN_GUTTER = SPACE.lg;

/** Gap between the header and the first thing a screen scrolls. */
export const SCREEN_TOP = SPACE.sm;

/**
 * Bottom padding of a scroll view with nothing floating over it. Stack screens,
 * which run to the bottom edge, add the safe-area inset on top of this.
 */
export const SCREEN_BOTTOM = SPACE.xxl;

/**
 * Card rhythm, shared by the cards a screen stacks.
 *
 * Two numbers, deliberately: the gap between cards and the padding inside one.
 * They used to be per-card values -- 16 here, 18 there, plus an extra marginBottom
 * on two of the four -- and the screen read as a pile rather than a column.
 */

/** Vertical gap between cards. Applied once, as `gap` on the scrolling container. */
export const CARD_GAP = SPACE.lg;

/**
 * Gap between groups of cards -- a section heading and what sits under it. Wider
 * than CARD_GAP, so the heading reads as belonging to the card below it.
 */
export const SECTION_GAP = SPACE.xl;

/** Gap between a section heading and its card: closer than anything around it. */
export const HEADING_GAP = SPACE.sm;

/** Padding inside a card, the same on every one. */
export const CARD_PADDING = SPACE.lg;

/** Padding of one row in a list card (menu rows, questions, tips). */
export const ROW_PADDING_V = SPACE.md;
export const ROW_PADDING_H = SPACE.lg;

/** Smallest tappable area, per side. A smaller visual gets hitSlop up to this. */
export const MIN_TOUCH = 44;

/** Even hitSlop that grows a `size`-px control to MIN_TOUCH. */
export const hitSlopFor = (size: number) => Math.max(0, Math.ceil((MIN_TOUCH - size) / 2));

/** Size of the floating action button, and how far it sits off the bottom edge. */
export const FAB_SIZE = 60;
export const FAB_BOTTOM = 20;

/**
 * Bottom padding for a scroll view that has the FAB floating over it.
 *
 * The FAB is outside the scroll view, so nothing makes room for it -- the last
 * card scrolls underneath. This clears the button and leaves one CARD_GAP under
 * it, which also absorbs its hard shadow.
 */
export const FAB_CLEARANCE = FAB_BOTTOM + FAB_SIZE + CARD_GAP;
