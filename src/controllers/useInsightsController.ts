import { useCallback, useEffect, useMemo } from 'react';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { JournalEntry } from '@shared/types';
import { resolveEmotionId } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { entriesQueryOptions, useEntriesQuery } from '../hooks/useEntriesQuery';
import { goalProgressQueryOptions, goalCompletionsQueryOptions } from '../hooks/useGoalsQuery';

const NO_ENTRIES: JournalEntry[] = [];

/** "YYYY-MM" -> the month before it, rolling January back into last December. */
function previousMonth(month: string): string {
    const parts = month.split('-');
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);

    const prevYear = monthNum === 1 ? year - 1 : year;
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}

/**
 * The one aggregation the stats endpoint does not cover: collapse a day's entries
 * into a single point per emotion so EmotionWavesChart has one value per day.
 * Per-emotion totals are not computed here — those come from emotionSummary below.
 */
function aggregateByDay(rawEntries: JournalEntry[]) {
    if (!rawEntries || rawEntries.length === 0) return [];

    const groupedByDate: Record<string, JournalEntry[]> = {};
    rawEntries.forEach(entry => {
        if (!entry.date) return;
        if (!groupedByDate[entry.date]) {
            groupedByDate[entry.date] = [];
        }
        groupedByDate[entry.date].push(entry);
    });

    return Object.keys(groupedByDate).map(date => {
        const group = groupedByDate[date];
        if (group.length === 1) {
            return group[0];
        }

        // Average timestamp across the same day
        const avgTimestamp = group.reduce((sum, e) => sum + (e.timestamp || 0), 0) / group.length;

        // Map and average emotions by unique ID
        const emotionSum: Record<string, { scaleSum: number; count: number; label: string; notes: string[] }> = {};

        group.forEach(entry => {
            if (entry.emotions) {
                entry.emotions.forEach((e: any) => {
                    const id = e.id;
                    if (!emotionSum[id]) {
                        emotionSum[id] = {
                            scaleSum: 0,
                            count: 0,
                            label: e.label,
                            notes: []
                        };
                    }
                    emotionSum[id].scaleSum += e.scale || 0;
                    emotionSum[id].count += 1;
                    if (e.note) {
                        emotionSum[id].notes.push(e.note);
                    }
                });
            }
        });

        const aggregatedEmotions = Object.keys(emotionSum).map(id => {
            const item = emotionSum[id];
            return {
                id,
                label: item.label,
                scale: item.count > 0 ? Number((item.scaleSum / item.count).toFixed(2)) : 0,
                note: item.notes.filter(n => n.trim() !== '').join('; ')
            };
        });

        return {
            id: `aggregated-${date}`,
            date,
            timestamp: avgTimestamp,
            emotions: aggregatedEmotions,
            isAggregated: true,
            originalCount: group.length
        };
    });
}

/** One emotion's month, as the breakdown card reads it. */
export interface EmotionSummary {
    /** Distinct days it was logged on -- five entries on one day still count once. */
    daysFelt: number;
    /** Mean intensity (1-5) over every time it was logged with a scale. */
    avgIntensity: number;
}

/**
 * Per emotion: the days it showed up on and how strongly it was felt.
 *
 * Counted here rather than fetched from GET /api/entries/stats: the screen already
 * holds every entry for the month to draw the chart, and the endpoint only re-read
 * those same documents to count them. One request instead of two, and the numbers
 * come from the very list the chart and the entry total do, so they cannot disagree.
 *
 * Days, not logs: a single rough afternoon logged five times would otherwise
 * outweigh a feeling that turned up quietly every day of the week. The average
 * is taken over the raw logs rather than the per-day averages, so each check-in
 * weighs the same.
 *
 * Retired ids fold into their replacement and unknown ones are skipped, the same
 * rule the server applied. API entries are already folded by the schema; guest
 * entries come straight off the device unparsed, so this resolves them too.
 */
function summarizeEmotions(rawEntries: JournalEntry[]): Record<string, EmotionSummary> {
    const tally: Record<string, { days: Set<string>; scaleSum: number; scored: number }> = {};

    rawEntries.forEach(entry => {
        entry.emotions?.forEach(emotion => {
            const key = resolveEmotionId(emotion.id);
            if (!key) return;
            const t = (tally[key] ??= { days: new Set(), scaleSum: 0, scored: 0 });
            if (entry.date) t.days.add(entry.date);
            // Skipped rather than counted as 0: a log without a scale says nothing
            // about intensity, and a zero would drag the average down for it.
            if (emotion.scale > 0) {
                t.scaleSum += emotion.scale;
                t.scored++;
            }
        });
    });

    return Object.fromEntries(
        Object.entries(tally).map(([id, t]) => [id, {
            daysFelt: t.days.size,
            avgIntensity: t.scored > 0 ? t.scaleSum / t.scored : 0,
        }])
    );
}

export const useInsightsController = (month?: string) => {
    // Full entry docs: the waves chart, the totals and the emotion counts all read these.
    const entriesQuery = useEntriesQuery(month);

    const rawEntries = entriesQuery.data ?? NO_ENTRIES;

    const aggregatedEntries = useMemo(() => aggregateByDay(rawEntries), [rawEntries]);
    const emotionSummary = useMemo(() => summarizeEmotions(rawEntries), [rawEntries]);

    // Last month, read only for the mood score's change. Same query and cache
    // key as any other month, but kept out of loading/error below: the screen
    // never waits on it, and a failed request just means no arrow.
    const prevEntriesQuery = useEntriesQuery(month ? previousMonth(month) : undefined);
    const prevAggregatedEntries = useMemo(
        () => (prevEntriesQuery.isSuccess ? aggregateByDay(prevEntriesQuery.data) : null),
        [prevEntriesQuery.isSuccess, prevEntriesQuery.data]
    );

    // The error card's retry: force both windows past their staleTime.
    const refreshStats = useCallback(() => {
        prevEntriesQuery.refetch();
        entriesQuery.refetch();
    }, [entriesQuery.refetch, prevEntriesQuery.refetch]);

    return {
        loading: entriesQuery.isLoading,
        isFetching: entriesQuery.isFetching,
        // Surfaced so the screen can say the month failed to load. Without it a
        // failed fetch is indistinguishable from a month with no entries.
        error: entriesQuery.error,
        totalEntries: rawEntries.length,
        entries: rawEntries,
        aggregatedEntries,
        // null until last month has loaded, and stays null if it fails.
        prevAggregatedEntries,
        emotionSummary,
        refreshStats
    };
};

/**
 * Warms every query the Insights tab opens with, so the first visit paints from
 * cache instead of a skeleton. Mounted by the tab navigator, i.e. once auth has
 * resolved.
 *
 * Waits out the persisted-cache restore: a prefetch fired before it would hit the
 * network for data the restore is about to hand back. prefetchQuery skips anything
 * already fresh and joins any request in flight -- the Today tab reads this month
 * too -- so this only ever costs the requests the cache cannot answer.
 *
 * Re-runs when the account changes: AuthContext resets the cache on a switch, and
 * the new account's Insights would otherwise start cold again.
 */
export const usePrefetchInsights = () => {
    const queryClient = useQueryClient();
    const isRestoring = useIsRestoring();
    const { user } = useAuth();
    const uid = user?.uid;

    useEffect(() => {
        if (isRestoring) return;

        // The month InsightsScreen opens on, built the same local-time way.
        const month = format(new Date(), 'yyyy-MM');
        queryClient.prefetchQuery(entriesQueryOptions(month));
        queryClient.prefetchQuery(entriesQueryOptions(previousMonth(month)));
        queryClient.prefetchQuery(goalProgressQueryOptions());
        queryClient.prefetchQuery(goalCompletionsQueryOptions());
    }, [isRestoring, queryClient, uid]);
};
