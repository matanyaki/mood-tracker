import { z } from 'zod';

/**
 * Payload of `GET /api/streaks`.
 *
 * Nothing here is stored. Both counts are derived from the entry dates already in
 * Firestore on every request, so there is no counter that can drift out of step
 * with the entries it claims to describe.
 *
 * The `last*Day` fields are local 'YYYY-MM-DD' keys, resolved with the caller's own
 * UTC offset, and are null when that kind of entry has never been written.
 */
export const StreakSummarySchema = z.object({
    emotionStreak: z.number().int().min(0),
    greetingStreak: z.number().int().min(0),
    lastEmotionDay: z.string().nullable(),
    lastGreetingDay: z.string().nullable(),
});

export type StreakSummary = z.infer<typeof StreakSummarySchema>;
