import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useInsightsQuery } from '../hooks/useInsightsQuery';

export const useInsightsController = (month?: string) => {
    const { data: rawEntries, isLoading, isFetching, refetch } = useInsightsQuery(month);

    // Refresh stats when the screen is focused
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    // Aggregate entries by date: average scale per unique emotion id per day
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
                        const id = (e.id || e.label || 'unknown').toLowerCase();
                        if (!emotionSum[id]) {
                            emotionSum[id] = {
                                scaleSum: 0,
                                count: 0,
                                label: e.label || e.id || 'unknown',
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

    const totalEntries = useMemo(() => rawEntries.length, [rawEntries]);

    return {
        loading: isLoading,
        isFetching,
        totalEntries,
        entries: rawEntries,
        aggregatedEntries,
        refreshStats: refetch
    };
};