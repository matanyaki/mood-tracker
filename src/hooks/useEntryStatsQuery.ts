import { useQuery } from '@tanstack/react-query';
import type { EntryStats } from '@shared/types';
import { JournalService } from '../services/journalService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId, retryTransportFailures } from './queryConfig';

/**
 * Fetches GET /api/entries/stats?month=YYYY-MM
 *
 * Returns the emotion count breakdown from the server.
 * Components display this directly — no on-device recomputation.
 */
export function useEntryStatsQuery(month?: string) {
    return useQuery<EntryStats>({
        queryKey: ['entries', 'stats', month],
        queryFn: () => JournalService.getEntryStats(actingUserId(), month as string),
        enabled: !!month,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}
