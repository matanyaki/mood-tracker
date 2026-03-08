import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { InsightsService } from '../services/insightsService';

import { getEmotionColor } from '../constants/colors';

export const useInsightsController = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [entries, setEntries] = useState<any[]>([]);

    const loadStats = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Fetch raw entries directly from the insights backend
            const rawEntries = await InsightsService.getInsightsData();
            setEntries(rawEntries || []);

            // Compute counts manually
            const counts: Record<string, number> = {};
            let totalEmotionCount = 0;

            rawEntries.forEach(entry => {
                if (entry.emotions && entry.emotions.length > 0) {
                    entry.emotions.forEach((emotionItem: any) => {
                        const key = (emotionItem.id || emotionItem.label || 'unknown').toLowerCase();
                        counts[key] = (counts[key] || 0) + 1;
                        totalEmotionCount++;
                    });
                }
            });

            // UI Logic: Transform Data for Chart
            const statsArray = Object.keys(counts).map(key => {
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

            setStats(statsArray);
            setTotalEntries(rawEntries.length);

        } catch (error) {
            console.log("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    return {
        loading,
        stats,
        totalEntries,
        entries,
        refreshStats: loadStats
    };
};