import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { JournalService } from '../services/journalService';
import { findEmotion, getEmotionColor } from '../utils/emotionUtils';

export const useInsightsController = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const { counts, total } = await JournalService.getStats(user.uid);

            // UI Logic: Transform Data for Chart
            const statsArray = Object.keys(counts).map(key => {
                const color = getEmotionColor(key);
                return {
                    label: key,
                    count: counts[key],
                    color: color,
                    percentage: total > 0 ? (counts[key] / total) * 100 : 0
                };
            }).sort((a, b) => b.count - a.count);

            setStats(statsArray);
            setTotalEntries(total);

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