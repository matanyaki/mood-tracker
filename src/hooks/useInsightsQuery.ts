import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightsService } from '../services/insightsService';
import type { JournalEntry } from '@shared/types';
import equal from 'fast-deep-equal';

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const useInsightsQuery = (month?: string) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const lastFetchedRef = useRef<Record<string, number>>({});

    const refetch = useCallback(async (force?: boolean) => {
        if (!month) return;

        const now = Date.now();
        const lastFetched = lastFetchedRef.current[month] || 0;
        if (!force && lastFetched > 0 && now - lastFetched < STALE_TIME_MS) {
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

            lastFetchedRef.current = { ...lastFetchedRef.current, [month]: Date.now() };
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
