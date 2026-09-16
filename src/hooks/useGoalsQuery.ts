import { useQuery } from '@tanstack/react-query';
import type { Goal, GoalCompletionsByGoal } from '@shared/types';
import { GoalService } from '../services/goalService';
import { STALE_TIME_MS, GC_TIME_MS, actingUserId, retryTransportFailures } from './queryConfig';

/**
 * Fetches GET /api/goals — the user's whole goal list.
 *
 * The ['goals'] key is invalidated by useGoalsController wherever a goal is
 * created, edited or deleted, so the list reflects a change the moment the form
 * saves rather than waiting out staleTime.
 */
export function useGoalsQuery() {
    return useQuery<Goal[]>({
        queryKey: ['goals'],
        queryFn: () => GoalService.getUserGoals(actingUserId()),
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}

/**
 * Fetches GET /api/goals/completions — every day marked done, keyed by goal.
 *
 * Separate from ['goals'] rather than folded into it because the two change for
 * different reasons: the goal list moves when a goal is created, edited or deleted,
 * and this moves every time a day is marked. The Diary reads both and joins them.
 */
export function useGoalCompletionsQuery() {
    return useQuery<GoalCompletionsByGoal>({
        queryKey: ['goalCompletions'],
        queryFn: () => GoalService.getAllCompletions(actingUserId()),
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}
