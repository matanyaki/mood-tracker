import { useCallback, useMemo } from 'react';
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

    // Pull-to-refresh: force both windows past their staleTime.
    const refreshStats = useCallback(() => {
        entriesQuery.refetch();
        statsQuery.refetch();
    }, [entriesQuery.refetch, statsQuery.refetch]);

    return {
        loading: entriesQuery.isLoading || statsQuery.isLoading,
        isFetching: entriesQuery.isFetching || statsQuery.isFetching,
        totalEntries: rawEntries.length,
        entries: rawEntries,
        aggregatedEntries,
        emotionCounts: statsQuery.data ?? NO_STATS,
        refreshStats
    };
};
