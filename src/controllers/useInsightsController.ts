import { useCallback, useMemo, useState } from 'react';
import type { JournalEntry, EntryStats } from '@shared/types';
import { useEntriesQuery } from '../hooks/useEntriesQuery';
import { useEntryStatsQuery } from '../hooks/useEntryStatsQuery';

const NO_ENTRIES: JournalEntry[] = [];
const NO_STATS: EntryStats = {};

export const useInsightsController = (month?: string) => {
    // Full entry docs for the waves chart; counts straight from the server.
    const entriesQuery = useEntriesQuery(month);
    const statsQuery = useEntryStatsQuery(month);

    const rawEntries = entriesQuery.data ?? NO_ENTRIES;

    // The one aggregation the stats endpoint does not cover: collapse a day's entries
    // into a single point per emotion so EmotionWavesChart has one value per day.
    // Emotion *counts* are not computed here — those come from emotionCounts below.
    const aggregatedEntries = useMemo(() => {
        if (!rawEntries || rawEntries.length === 0) return [];

        const groupedByDate: Record<string, typeof rawEntries> = {};
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
    }, [rawEntries]);

    // Tracked separately from `isFetching`, which is also true for the first load
    // and for any background refetch. A pull-to-refresh spinner driven by
    // `isFetching` appears on a screen nobody pulled, and then stays up for as long
    // as the fetch behind it does -- which is what made a slow load look frozen.
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pull-to-refresh: force both windows past their staleTime.
    const refreshStats = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // refetch() resolves with the result rather than rejecting, so a failed
            // refresh still releases the spinner.
            await Promise.all([entriesQuery.refetch(), statsQuery.refetch()]);
        } finally {
            setIsRefreshing(false);
        }
    }, [entriesQuery.refetch, statsQuery.refetch]);

    return {
        loading: entriesQuery.isLoading || statsQuery.isLoading,
        isFetching: entriesQuery.isFetching || statsQuery.isFetching,
        isRefreshing,
        // Surfaced so the screen can say the month failed to load. Without it a
        // failed fetch is indistinguishable from a month with no entries.
        error: entriesQuery.error ?? statsQuery.error,
        totalEntries: rawEntries.length,
        entries: rawEntries,
        aggregatedEntries,
        emotionCounts: statsQuery.data ?? NO_STATS,
        refreshStats
    };
};
