/**
 * Card rhythm, shared by the cards a screen stacks.
 *
 * Two numbers, deliberately: the gap between cards and the padding inside one.
 * They used to be per-card values -- 16 here, 18 there, plus an extra marginBottom
 * on two of the four -- and the screen read as a pile rather than a column.
 */

/** Vertical gap between cards. Applied once, as `gap` on the scrolling container. */
export const CARD_GAP = 16;

/** Padding inside a card, the same on every one. */
export const CARD_PADDING = 16;

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
