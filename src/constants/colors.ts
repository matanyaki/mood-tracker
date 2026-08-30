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
