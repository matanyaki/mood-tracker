// src/models/JournalEntry.ts
import { z } from 'zod';

// 1. The Schema (Runtime Validation)
// This ensures that even if bad data comes from the DB, our app catches it.
export const JournalEntrySchema = z.object({
    id: z.string().optional(), // ID is optional because new entries don't have one yet
    userId: z.string(),
    date: z.string(), // YYYY-MM-DD
    timestamp: z.number(),

    // --- EMOTIONS ARRAY (Required) ---
    // Array of all selected emotions for this entry. 
    // This is now the ONLY way emotions are stored.
    emotions: z.array(z.object({
        id: z.string(),
        label: z.string(),
        scale: z.number().min(1).max(5),
        note: z.string().optional()
    })).min(1),

    // --- NEW FIELD FOR AI ---
    // Stores the immediate advice/analysis given by AI for this specific entry
    aiFeedback: z.string().optional(),

    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

// 2. The Type (TypeScript Interface)
// We automatically generate the Type from the Schema (Don't write it twice!)
export type JournalEntry = z.infer<typeof JournalEntrySchema>;