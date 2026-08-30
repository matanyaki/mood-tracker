import { useQuery } from '@tanstack/react-query';
import { GreetingService, Greeting } from '../services/greetingService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId } from './queryConfig';

/**
 * Fetches the user's greetings, which DiaryScreen dots the calendar with.
 *
 * Here for the same reason as useEntriesQuery: it replaces the second
 * hand-rolled AsyncStorage-plus-deep-equal cache that lived in useDiaryController.
 */
export function useGreetingsQuery() {
    return useQuery<Greeting[]>({
        queryKey: ['greetings'],
        queryFn: () => GreetingService.getUserGreetings(actingUserId()),
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
    });
}
