import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InsightsService } from '../services/insightsService';
import type { JournalEntry } from '@shared/types';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import { getEmotionColor } from '../constants/colors';

export const useInsightsQuery = (days?: number) => {
    return useQuery<JournalEntry[], Error>({
        queryKey: ['insights', days || 'all'],
        queryFn: () => InsightsService.getInsightsData(days),
        staleTime: 5 * 60 * 1000, // 5 minutes (user sees cached insights immediately while new data fetches in background)
        gcTime: 30 * 60 * 1000,   // 30 minutes cache time
    });
};

// Helper hook to process data for the chart and breakdown
export const useProcessedInsights = (days?: number) => {
    const { data: entries, isLoading, isFetching, refetch } = useInsightsQuery(days);

    const safeEntries = useMemo(() => entries || [], [entries]);

    // Compute stats
    const statsArray = useMemo(() => {
        const counts: Record<string, number> = {};
        let totalEmotionCount = 0;

        safeEntries.forEach(entry => {
            if (entry.emotions && entry.emotions.length > 0) {
                entry.emotions.forEach((emotionItem: any) => {
                    const key = (emotionItem.id || emotionItem.label || 'unknown').toLowerCase();
                    counts[key] = (counts[key] || 0) + 1;
                    totalEmotionCount++;
                });
            }
        });

        return Object.keys(counts).map(key => {
            const color = getEmotionColor(key);
            const label = key.charAt(0).toUpperCase() + key.slice(1);

            return {
                id: key,
                label: label,
                count: counts[key],
                color: color,
                percentage: totalEmotionCount > 0 ? (counts[key] / totalEmotionCount) * 100 : 0
            };
        }).sort((a, b: any) => b.count - a.count);
    }, [safeEntries]);

    return {
        entries: safeEntries,
        stats: statsArray,
        totalEntries: safeEntries.length,
        loading: isLoading,
        isFetching,
        refreshStats: refetch
    };
};
