import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightsService } from '../services/insightsService';
import type { JournalEntry } from '@shared/types';
import { getEmotionColor } from '../constants/colors';
import equal from 'fast-deep-equal';

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const useInsightsQuery = (month?: string) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const lastFetchedRef = useRef<number>(0);

    const refetch = useCallback(async () => {
        if (!month) return;

        const now = Date.now();
        if (lastFetchedRef.current > 0 && now - lastFetchedRef.current < STALE_TIME_MS) {
            return;
        }

        const cacheKey = `@journal_month_${month}`;

        setIsFetching(true);
        try {
            // 1. Instantly query AsyncStorage cache
            const cachedData = await AsyncStorage.getItem(cacheKey);
            let initialEntries: JournalEntry[] = [];
            if (cachedData) {
                initialEntries = JSON.parse(cachedData);
                setEntries(initialEntries);
            }

            // 2. Fire network request
            const fetchedData = await InsightsService.getInsightsData(month);

            // 3. Only update state and cache if data changed
            if (!equal(fetchedData, initialEntries)) {
                console.log(`[useInsightsQuery] State mismatch for month ${month}. Updating cache and state.`);
                setEntries(fetchedData || []);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(fetchedData || []));
            } else {
                console.log(`[useInsightsQuery] Cached state for month ${month} is identical.`);
            }

            lastFetchedRef.current = Date.now();
        } catch (error) {
            console.error("Error fetching insights in query hook:", error);
        } finally {
            setIsFetching(false);
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        data: entries,
        isLoading: loading,
        isFetching,
        refetch
    };
};

// Helper hook to process data for the chart and breakdown
export const useProcessedInsights = (month?: string) => {
    const { data: entries, isLoading, isFetching, refetch } = useInsightsQuery(month);

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
