import { useQuery } from '@tanstack/react-query';
import type { StreakSummary } from '@shared/types';
import { StreakService } from '../services/streakService';
import { dayKeyFromMillis, streakStillAlive } from '../../shared/utils/streak';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId, retryTransportFailures } from './queryConfig';

/**
 * Zero any streak whose last day is now older than yesterday.
 *
 * The summary may have been restored from the persisted cache after days away, and
 * its counts are as of the moment the server answered. Checking the stored last day
 * against today's clock makes the first paint agree with what the refetch will say,
 * instead of showing "5 DAYS" and then dropping to zero in front of the user.
 */
const withBrokenStreaksZeroed = (summary: StreakSummary): StreakSummary => {
    const today = dayKeyFromMillis(Date.now(), new Date().getTimezoneOffset());

    return {
        ...summary,
        emotionStreak: streakStillAlive(summary.lastEmotionDay, today) ? summary.emotionStreak : 0,
        greetingStreak: streakStillAlive(summary.lastGreetingDay, today) ? summary.greetingStreak : 0,
    };
};

/**
 * Fetches GET /api/streaks — the emotion and greeting day counts.
 *
 * Nothing is stored server-side, so the cache IS the streak as far as the UI is
 * concerned. The ['streaks'] key is invalidated wherever an entry or a greeting is
 * created (useReflectionController, useGreetingController) so the card updates the
 * moment a new day is logged rather than waiting out staleTime.
 *
 * The cache is persisted to the device (App.tsx), so on a cold start `data` is the
 * last known summary, re-checked against today by `select`, while the refetch runs.
 */
export function useStreaksQuery() {
    return useQuery<StreakSummary>({
        queryKey: ['streaks'],
        queryFn: () => StreakService.getStreaks(actingUserId()),
        select: withBrokenStreaksZeroed,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}
