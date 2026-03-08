// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { JournalService } from '../services/journalService';
import { GreetingService, Greeting } from '../services/greetingService';
import { auth } from '../config/firebase'; // Ensure auth is available or handle user check
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';

import { getEmotionColor } from '../constants/colors';

export const useDiaryController = () => {
    // --- State ---
    const [entries, setEntries] = useState<any[]>([]);
    const [greetings, setGreetings] = useState<Greeting[]>([]);
    const [loading, setLoading] = useState(true);
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

            const [entriesData, greetingsData] = await Promise.all([
                JournalService.getUserEntries(userId),
                GreetingService.getUserGreetings(userId)
            ]);

            setEntries(entriesData || []);
            setGreetings(greetingsData || []);
        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

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
                const emotions = entry.emotions || [];

                let dotColor = '#A78BFA'; // fallback purple
                if (emotions.length > 0) {
                    if (emotions.length === 1) {
                        const emotionId = emotions[0].id || emotions[0].name || 'neutral';
                        dotColor = getEmotionColor(emotionId);
                    } else {
                        dotColor = '#A78BFA'; // mixed mood
                    }
                } else if (entry.emotion) {
                    dotColor = getEmotionColor(entry.emotion.toLowerCase());
                }

                if (!marked[dateStr]) {
                    marked[dateStr] = { dots: [] };
                }

                // Add mood dot
                if (!marked[dateStr].dots.some((d: any) => d.key === 'mood')) {
                    marked[dateStr].dots.push({ key: 'mood', color: dotColor });
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
    const handleDayPress = (day: DateData) => {
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
    };

    const handleMonthChange = (month: DateData) => setCurrentMonth(month.dateString);

    const goToToday = () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setCurrentMonth(today);
        setSelectedDate(today);
    };

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
