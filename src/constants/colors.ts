import { EMOTIONS, type EmotionId } from '../../shared/types/emotions';

/** Fallback for ids outside the taxonomy — not an emotion itself. */
export const NEUTRAL_COLOR = '#6B7280'; // Gray

export const EMOTION_COLORS = Object.fromEntries(
    EMOTIONS.map(e => [e.id, e.color])
) as Record<EmotionId, string>;

export const getEmotionColor = (id: string): string => {
    const key = id?.toLowerCase();
    // Callers pass free-form strings (chart keys, labels), so widen before lookup.
    return (EMOTION_COLORS as Record<string, string>)[key] || NEUTRAL_COLOR;
};

/**
 * A colour's own hue at 45% of its brightness, for text drawn in that colour.
 *
 * The emotion colours are fills -- bars, pips, accent stripes -- and most of them
 * are far too light to read as text on paper (Happy is 1.5:1). This keeps the hue,
 * so the word still reads as its emotion, at 6:1 or better on PAPER for all nine.
 */
export const darkInk = (hexColor: string): string => {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.substring(i, i + 2), 16) || 0);
    return `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`;
};

/** Text colour for an emotion's name or value. Fills keep getEmotionColor. */
export const getEmotionInk = (id: string): string => darkInk(getEmotionColor(id));

/**
 * Text colours for the app's status hues. The fills stay as they are (goal green
 * #10B981, danger #EF4444, warning #D97706); these are the darker shades already in
 * the palette, used only where the hue is the TEXT, so it clears 4.5:1 on paper.
 */
export const GOAL_TEXT = '#166534';    // 7.0:1 on PAPER (fill #10B981 is 2.5:1)
export const DANGER_TEXT = '#DC2626';  // 4.8:1 (fill #EF4444 is 3.7:1)
export const WARNING_TEXT = '#B45309'; // 4.9:1 (fill #D97706 is 3.1:1)
