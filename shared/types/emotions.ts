import { z } from 'zod';

/**
 * Single source of truth for the emotion taxonomy.
 *
 * Ids, labels, image keys and colors all live here — the client constants
 * (`src/constants/emotions.ts`, `src/constants/colors.ts`) and the server-side
 * entry schema all derive from this list. Add, rename or recolor an emotion in
 * this file only.
 *
 * The order is the order everything renders in: the check-in picker, the wave
 * chart's emotion dropdown and the Insights breakdown all walk this array. It
 * runs pleasant → unpleasant, and within that from energized to flat, so the
 * picker reads as a spectrum rather than an alphabetical list.
 */
export const EMOTIONS = [
    { id: 'happy', label: 'Happy', imageKey: 'happy', color: '#F59E0B' },          // Amber
    { id: 'excited', label: 'Excited', imageKey: 'excited', color: '#EC4899' },    // Pink
    { id: 'calm', label: 'Calm', imageKey: 'calm', color: '#10B981' },             // Emerald
    { id: 'confused', label: 'Confused', imageKey: 'confused', color: '#A855F7' }, // Purple
    { id: 'bored', label: 'Bored', imageKey: 'bored', color: '#94A3B8' },          // Slate
    { id: 'tired', label: 'Tired', imageKey: 'tired', color: '#0EA5E9' },          // Sky
    { id: 'sad', label: 'Sad', imageKey: 'sad', color: '#3B82F6' },                // Blue
    { id: 'anxious', label: 'Anxious', imageKey: 'anxious', color: '#8B5CF6' },    // Violet
    { id: 'angry', label: 'Angry', imageKey: 'angry', color: '#EF4444' },          // Red
] as const;

export type EmotionId = typeof EMOTIONS[number]['id'];

const EMOTION_IDS = EMOTIONS.map(e => e.id) as [EmotionId, ...EmotionId[]];

/**
 * Ids that entries were written with before the taxonomy changed, each pointing
 * at the emotion that replaced it.
 *
 * Firestore holds whatever id was current when the entry was saved, and nothing
 * rewrites those documents. Without this map, `worry` and `fear` entries fail
 * `EmotionIdSchema` — which means the client drops them on read and their counts
 * vanish from Insights. Reads normalize through here instead, so old entries
 * keep showing up under the emotion that succeeded them.
 *
 * Retired ids stay out of `EMOTIONS`, so they are never offered in the picker;
 * this map only makes already-logged data readable.
 */
export const LEGACY_EMOTION_IDS: Record<string, EmotionId> = {
    worry: 'anxious',
    fear: 'anxious',
};

/**
 * Current id for a stored one — the id itself when it is still in the taxonomy,
 * the replacement when it was retired, `undefined` when it is neither.
 */
export function resolveEmotionId(id: string): EmotionId | undefined {
    const key = id?.toLowerCase();
    if (EMOTIONS.some(e => e.id === key)) return key as EmotionId;
    return LEGACY_EMOTION_IDS[key];
}

/**
 * Rejects unknown emotion ids at the API boundary, and folds retired ones into
 * their replacement so an entry written before a rename still parses.
 */
export const EmotionIdSchema = z.preprocess(
    raw => (typeof raw === 'string' ? resolveEmotionId(raw) ?? raw : raw),
    z.enum(EMOTION_IDS)
);

/**
 * The one and only id → imageKey mapping. Callers resolve asset keys through
 * this — never by branching on an id.
 *
 * Takes a plain string because some callers read ids straight off stored
 * documents. An id outside the taxonomy resolves to no asset rather than
 * throwing: a missing emoji is a blank square, a throw is a blank screen.
 */
export function getEmotionImageKey(id: string): string {
    const resolved = resolveEmotionId(id);
    return EMOTIONS.find(e => e.id === resolved)?.imageKey ?? id;
}

/** The taxonomy's label for an id, so stored labels never drift from it. */
export function getEmotionLabel(id: string): string {
    const resolved = resolveEmotionId(id);
    return EMOTIONS.find(e => e.id === resolved)?.label ?? id;
}
