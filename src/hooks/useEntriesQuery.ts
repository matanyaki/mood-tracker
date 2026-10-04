import { queryOptions, useQuery } from '@tanstack/react-query';
import { JournalService } from '../services/journalService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId, retryTransportFailures } from './queryConfig';

/**
 * GET /api/entries?month=YYYY-MM, as a query definition.
 *
 * Shared by useEntriesQuery and by usePrefetchInsights, so a prefetched month
 * lands under exactly the key, staleTime and retry policy the screen reads with.
 */
export const entriesQueryOptions = (month?: string) => queryOptions({
    queryKey: ['entries', month],
    queryFn: () => JournalService.getUserEntries(actingUserId(), month),
    enabled: !!month,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    retry: retryTransportFailures,
});

/**
 * Fetches GET /api/entries?month=YYYY-MM
 *
 * Shared by DiaryScreen and InsightsScreen via the ['entries', month] cache key.
 * TanStack Query handles deduplication — if both screens mount for the same
 * month, only one network request fires.
 */
export function useEntriesQuery(month?: string) {
    return useQuery(entriesQueryOptions(month));
}
