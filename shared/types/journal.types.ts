import { z } from 'zod';

export const JournalEntrySchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    date: z.string(), // YYYY-MM-DD
    timestamp: z.number(), // Unix timestamp from client

    // --- EMOTIONS ARRAY (Required) ---
    // Array of all selected emotions for this entry.
    emotions: z.array(z.object({
        id: z.string(),
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
