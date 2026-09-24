import { z } from 'zod';
import { EmotionIdSchema, getEmotionLabel } from './emotions';

export const JournalEntrySchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    date: z.string(), // YYYY-MM-DD
    timestamp: z.number(), // Unix timestamp from client

    // --- EMOTIONS ARRAY (Required) ---
    // Array of all selected emotions for this entry.
    //
    // `label` is taken from the taxonomy rather than from the document. The id is
    // normalized on the way in (a retired id folds into its replacement), and a
    // stored label would still read "Worry" beside the Anxious icon and colour.
    // Deriving it keeps the three in step for entries written at any point.
    emotions: z.array(z.object({
        id: EmotionIdSchema,
        label: z.string(),
        scale: z.number().min(1).max(5),
        note: z.string().optional()
    }).transform(e => ({ ...e, label: getEmotionLabel(e.id) }))).min(1),

    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export type CreateJournalEntryDTO = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>;

/**
 * Payload of `GET /api/entries/stats` — emotion id → number of occurrences across
 * the requested window. Emotions with no occurrences are absent, not zero.
 *
 * Deliberately keyed by `string` rather than `EmotionIdSchema`: the record is built
 * from stored documents, and rejecting an unrecognised key would fail the whole
 * response instead of the one obsolete count. Counts for a retired id are already
 * folded into its replacement by the aggregator, so the keys a caller cares about
 * are taxonomy ids; consumers read those and ignore anything else.
 */
export const EntryStatsSchema = z.record(z.string(), z.number());

export type EntryStats = z.infer<typeof EntryStatsSchema>;
