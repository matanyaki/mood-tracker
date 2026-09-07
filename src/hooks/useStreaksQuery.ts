import { useQuery } from '@tanstack/react-query';
import type { StreakSummary } from '@shared/types';
import { StreakService } from '../services/streakService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId, retryTransportFailures } from './queryConfig';

/**
 * Fetches GET /api/streaks — the emotion and greeting day counts.
 *
 * Nothing is stored server-side, so the cache IS the streak as far as the UI is
 * concerned. The ['streaks'] key is invalidated wherever an entry or a greeting is
 * created (useReflectionController, useGreetingController) so the card updates the
 * moment a new day is logged rather than waiting out staleTime.
 */
export function useStreaksQuery() {
    return useQuery<StreakSummary>({
        queryKey: ['streaks'],
        queryFn: () => StreakService.getStreaks(actingUserId()),
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}
