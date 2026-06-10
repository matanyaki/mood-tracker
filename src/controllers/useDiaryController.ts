// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalService } from '../services/journalService';
import { GreetingService, Greeting } from '../services/greetingService';
import { auth } from '../config/firebase';
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';
import equal from 'fast-deep-equal';

import { getEmotionColor } from '../constants/colors';

export const useDiaryController = () => {
    // --- State ---
    const [entries, setEntries] = useState<any[]>([]);
    const [greetings, setGreetings] = useState<Greeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [modalVisible, setModalVisible] = useState(false);

    // --- Data Fetching ---
    /* 
       Note: We assume auth.currentUser is available. 
       In a real app, might want to use a context or listener.
    */
    const loadData = useCallback(async () => {
        try {
            const user = auth.currentUser;
            const userId = user ? user.uid : JournalService.GUEST_ID;
            const monthParam = currentMonth.substring(0, 7); // Format: 'YYYY-MM'
            const cacheKey = `@journal_month_${monthParam}`;
            const greetingsCacheKey = `@greetings_cache`;

            console.log(`[useDiaryController] SWR cache query key: ${cacheKey}`);

            // 1. Instantly query AsyncStorage cache
            const [cachedData, cachedGreetings] = await Promise.all([
                AsyncStorage.getItem(cacheKey),
                AsyncStorage.getItem(greetingsCacheKey)
            ]);

            let initialEntries: any[] = [];
            if (cachedData) {
                initialEntries = JSON.parse(cachedData);
                setEntries(initialEntries);
            }

            let initialGreetings: Greeting[] = [];
            if (cachedGreetings) {
                initialGreetings = JSON.parse(cachedGreetings);
                setGreetings(initialGreetings);
            }

            // 2. Simultaneously fire network request in background
            const [entriesData, greetingsData] = await Promise.all([
                JournalService.getUserEntries(userId, monthParam).catch(err => {
                    console.log("[useDiaryController] Failed to fetch entries from server:", err);
                    return initialEntries; // Fallback to cache
                }),
                GreetingService.getUserGreetings(userId).catch(err => {
                    console.log("[useDiaryController] Failed to fetch greetings from server:", err);
                    return initialGreetings; // Fallback to cache
                })
            ]);

            const resolvedEntriesData = entriesData || [];
            const resolvedGreetingsData = greetingsData || [];

            // 3. Deep equality check
            if (!equal(resolvedEntriesData, initialEntries)) {
                console.log(`[useDiaryController] State mismatch detected. Updating entries state and local cache.`);
                setEntries(resolvedEntriesData);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(resolvedEntriesData));
            } else {
                console.log(`[useDiaryController] Cached state is identical. Skipping update.`);
            }

            if (!equal(resolvedGreetingsData, initialGreetings)) {
                console.log(`[useDiaryController] Greetings state mismatch detected. Updating greetings state and local cache.`);
                setGreetings(resolvedGreetingsData);
                await AsyncStorage.setItem(greetingsCacheKey, JSON.stringify(resolvedGreetingsData));
            } else {
                console.log(`[useDiaryController] Cached greetings are identical. Skipping update.`);
            }
        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // --- Calendar Logic ---
    const markedDates = useMemo(() => {
        const marked: any = {};

        // Group entries by date
        entries.forEach(entry => {
            if (entry.timestamp) {
                const dateStr = format(new Date(entry.timestamp), 'yyyy-MM-dd');

                if (!marked[dateStr]) {
                    marked[dateStr] = { dots: [] };
                }

                // Add mood dot
                if (!marked[dateStr].dots.some((d: any) => d.key === 'mood')) {
                    marked[dateStr].dots.push({ key: 'mood', color: '#A78BFA' });
                }
            }
        });

        // Add greetings dots
        greetings.forEach(greeting => {
            if (greeting.createdAt) {
                const dateStr = format(new Date(greeting.createdAt), 'yyyy-MM-dd');
                if (!marked[dateStr]) {
                    marked[dateStr] = { dots: [] };
                }

                // Add greeting dot
                if (!marked[dateStr].dots.some((d: any) => d.key === 'greeting')) {
                    marked[dateStr].dots.push({ key: 'greeting', color: '#0099ffff' });
                }
            }
        });

        // (Future) Add Goal dots here similarly, using blue/green color like '#10B981'

        // Apply selected styling
        if (selectedDate) {
            if (!marked[selectedDate]) {
                marked[selectedDate] = { dots: [] };
            }
            marked[selectedDate].selected = true;
            marked[selectedDate].selectedColor = '#1A1A2E';
            marked[selectedDate].selectedTextColor = '#FFFFFF';
        }

        return marked;
    }, [entries, greetings, selectedDate]);

    const selectedDateEntries = useMemo(() => {
        if (!selectedDate) return [];
        return entries.filter(entry => {
            if (!entry.timestamp) return false;
            const entryDate = format(new Date(entry.timestamp), 'yyyy-MM-dd');
            return entryDate === selectedDate;
        });
    }, [selectedDate, entries]);

    const selectedDateGreetings = useMemo(() => {
        if (!selectedDate) return [];
        return greetings.filter(greeting => {
            if (!greeting.createdAt) return false;
            const greetingDate = format(new Date(greeting.createdAt), 'yyyy-MM-dd');
            return greetingDate === selectedDate;
        });
    }, [selectedDate, greetings]);

    // --- Handlers ---
    const handleDayPress = useCallback((day: DateData) => {
        const dateStr = day.dateString;
        setSelectedDate(dateStr);

        // Open modal if there are entries or greetings for this day
        const hasEntries = entries.some(entry => {
            if (!entry.timestamp) return false;
            return format(new Date(entry.timestamp), 'yyyy-MM-dd') === dateStr;
        });

        const hasGreetings = greetings.some(greeting => {
            if (!greeting.createdAt) return false;
            return format(new Date(greeting.createdAt), 'yyyy-MM-dd') === dateStr;
        });

        if (hasEntries || hasGreetings) {
            setModalVisible(true);
        }
    }, [entries, greetings]);

    const handleMonthChange = useCallback((month: DateData) => setCurrentMonth(month.dateString), []);

    const goToToday = useCallback(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setCurrentMonth(today);
        setSelectedDate(today);
    }, []);

    return {
        entries,
        loading,
        selectedDate,
        currentMonth,
        modalVisible,
        setModalVisible,
        markedDates,
        selectedDateEntries,
        selectedDateGreetings,
        handleDayPress,
        handleMonthChange,
        goToToday,
        getEmotionColor, // expose for UI if needed
    };
};
