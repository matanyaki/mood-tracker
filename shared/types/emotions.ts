import { z } from 'zod';

/**
 * Single source of truth for the emotion taxonomy.
 *
 * Ids, labels, image keys and colors all live here — the client constants
 * (`src/constants/emotions.ts`, `src/constants/colors.ts`) and the server-side
 * entry schema all derive from this list. Add, rename or recolor an emotion in
 * this file only.
 */
export const EMOTIONS = [
    { id: 'happy', label: 'Happy', imageKey: 'happy', color: '#F59E0B' },   // Amber
    { id: 'sad', label: 'Sad', imageKey: 'sad', color: '#3B82F6' },         // Blue
    { id: 'worry', label: 'Worry', imageKey: 'bad', color: '#8B5CF6' },     // Violet
    { id: 'fear', label: 'Fear', imageKey: 'fearful', color: '#10B981' },   // Emerald
    { id: 'angry', label: 'Angry', imageKey: 'angry', color: '#EF4444' },   // Red
] as const;

export type EmotionId = typeof EMOTIONS[number]['id'];

/** Rejects unknown emotion ids at the API boundary. */
export const EmotionIdSchema = z.enum(
    EMOTIONS.map(e => e.id) as [EmotionId, ...EmotionId[]]
);

/**
 * The one and only id → imageKey mapping. Callers resolve asset keys through
 * this — never by branching on an id.
 */
export function getEmotionImageKey(id: EmotionId): string {
    return EMOTIONS.find(e => e.id === id)!.imageKey;
}
