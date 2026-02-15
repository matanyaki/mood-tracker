import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { JournalService } from '../services/journalService';

import { getEmotionColor } from '../constants/colors';

export const useInsightsController = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // 'total' is now totalEmotionCount (for percentages)
            // 'totalEntries' is the count of distinct journal entries (for summary card)
            // We need to cast the result because we added a new property 'totalEntries' 
            const data = await JournalService.getStats(user.uid);
            const { counts, total } = data;
            const totalCheckins = (data as any).totalEntries || total; // Fallback

            // UI Logic: Transform Data for Chart
            const statsArray = Object.keys(counts).map(key => {
                const color = getEmotionColor(key);
                // Ensure key is capitalized for label if needed, or rely on UI to transform
                const label = key.charAt(0).toUpperCase() + key.slice(1);

                return {
                    id: key,
                    label: label,
                    count: counts[key],
                    color: color,
                    percentage: total > 0 ? (counts[key] / total) * 100 : 0
                };
            }).sort((a, b) => b.count - a.count);

            setStats(statsArray);
            setTotalEntries(totalCheckins);

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
        refreshStats: loadStats
    };
};