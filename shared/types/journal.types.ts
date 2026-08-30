import { z } from 'zod';
import { EmotionIdSchema } from './emotions';

export const JournalEntrySchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    date: z.string(), // YYYY-MM-DD
    timestamp: z.number(), // Unix timestamp from client

    // --- EMOTIONS ARRAY (Required) ---
    // Array of all selected emotions for this entry.
    emotions: z.array(z.object({
        id: EmotionIdSchema,
        label: z.string(),
        scale: z.number().min(1).max(5),
        note: z.string().optional()
    })).min(1),

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
 * from stored documents, and rejecting a key retired from the taxonomy would fail the
 * whole response instead of the one obsolete count. Consumers read known ids and
 * ignore the rest.
 */
export const EntryStatsSchema = z.record(z.string(), z.number());

export type EntryStats = z.infer<typeof EntryStatsSchema>;
