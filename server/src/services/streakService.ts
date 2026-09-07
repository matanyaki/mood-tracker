import { journalRepository } from '../repositories/journalRepository';
import { greetingRepository } from '../repositories/greetingRepository';
import { rethrow } from '../middleware/errorHandler';
import { computeStreak, dayKeyFromMillis, latestDayKey } from '../../../shared/utils/streak';
import type { StreakSummary } from '../../../shared/types';

/**
 * How far back the day keys are read.
 *
 * A streak is unbounded in principle, but the query behind it is not — without a
 * cutoff this reads the user's entire history on every home-screen render. A little
 * over a year covers any streak a journalling app realistically shows; a longer one
 * reports as 400 days.
 */
const MAX_STREAK_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

class StreakService {
    /**
     * Both streaks, derived from the entry dates on every call.
     *
     * The two are counted independently and share only the day-key rule: every
     * instant — entry timestamps, greeting createdAt, and `today` itself — is
     * converted with the SAME caller-supplied offset, so nothing here mixes a UTC
     * day with a local one.
     */
    async getStreakSummary(userId: string, tzOffsetMinutes: number): Promise<StreakSummary> {
        try {
            const now = Date.now();
            const sinceMs = now - MAX_STREAK_DAYS * DAY_MS;

            const [entryTimestamps, greetingTimestamps] = await Promise.all([
                journalRepository.getRecentTimestamps(userId, sinceMs),
                greetingRepository.getRecentCreatedAtMillis(userId, sinceMs),
            ]);

            const today = dayKeyFromMillis(now, tzOffsetMinutes);
            const emotionDays = entryTimestamps.map(ms => dayKeyFromMillis(ms, tzOffsetMinutes));
            const greetingDays = greetingTimestamps.map(ms => dayKeyFromMillis(ms, tzOffsetMinutes));

            return {
                emotionStreak: computeStreak(emotionDays, today),
                greetingStreak: computeStreak(greetingDays, today),
                lastEmotionDay: latestDayKey(emotionDays),
                lastGreetingDay: latestDayKey(greetingDays),
            };
        } catch (error: unknown) {
            return rethrow(error, 'Failed to calculate streaks');
        }
    }
}

export default new StreakService();
