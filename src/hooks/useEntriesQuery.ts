import { useQuery } from '@tanstack/react-query';
import type { JournalEntry } from '@shared/types';
import { JournalService } from '../services/journalService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId } from './queryConfig';

/**
 * Fetches GET /api/entries?month=YYYY-MM
 *
 * Shared by DiaryScreen and InsightsScreen via the ['entries', month] cache key.
 * TanStack Query handles deduplication — if both screens mount for the same
 * month, only one network request fires.
 */
export function useEntriesQuery(month?: string) {
    return useQuery<JournalEntry[]>({
        queryKey: ['entries', month],
        queryFn: () => JournalService.getUserEntries(actingUserId(), month),
        enabled: !!month,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
    });
}
