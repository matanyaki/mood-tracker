// src/models/JournalEntry.ts
import { z } from 'zod';

// 1. The Schema (Runtime Validation)
// This ensures that even if bad data comes from the DB, our app catches it.
export const JournalEntrySchema = z.object({
    id: z.string().optional(), // ID is optional because new entries don't have one yet
    userId: z.string(),
    date: z.string(), // YYYY-MM-DD
    timestamp: z.number(),
    primaryEmotion: z.string(),
    emotions: z.array(z.object({
        name: z.string(),
        path: z.string().optional(),
        note: z.string().optional()
    })),

    // --- NEW FIELD FOR AI ---
    // Stores the immediate advice/analysis given by AI for this specific entry
    aiFeedback: z.string().optional(),
});

// 2. The Type (TypeScript Interface)
// We automatically generate the Type from the Schema (Don't write it twice!)
export type JournalEntry = z.infer<typeof JournalEntrySchema>;