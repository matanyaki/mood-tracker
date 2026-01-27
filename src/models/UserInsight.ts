// src/models/UserInsight.ts
import { z } from 'zod';

export const UserInsightSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    generatedAt: z.number(), // When did the AI write this?
    period: z.enum(['weekly', 'monthly']), // Is this a weekly or monthly summary?
    startDate: z.string(), // YYYY-MM-DD
    endDate: z.string(),   // YYYY-MM-DD

    // The AI Analysis
    summary: z.string(),
    patterns: z.array(z.string()), // e.g. ["You feel anxious on Mondays"]
    recommendations: z.array(z.string()), // e.g. ["Try meditation on Sunday night"]
    sentimentScore: z.number(), // -1 (Negative) to 1 (Positive)
});

export type UserInsight = z.infer<typeof UserInsightSchema>;