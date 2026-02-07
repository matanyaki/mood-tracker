// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { JournalService } from '../services/journalService';
import { auth } from '../config/firebase'; // Ensure auth is available or handle user check
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';

import { getEmotionColor } from '../constants/colors';

export const useDiaryController = () => {
    // --- State ---
    const [entries, setEntries] = useState<any[]>([]);
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
            if (!user) return;

            const data = await JournalService.getUserEntries(user.uid);
            setEntries(data || []);
        } catch (error) {
            console.log("Error fetching entries:", error);
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
        const today = format(new Date(), 'yyyy-MM-dd');

        entries.forEach(entry => {
            if (entry.timestamp) {
                const dateStr = format(new Date(entry.timestamp), 'yyyy-MM-dd');
                const emotions = entry.emotions || [];

                // Dot Logic:
                // 1. No emotions -> Gray
                // 2. Single emotion -> Emotion color
                // 3. Multiple emotions -> Mixed Mood Color (Lavender/Purple)
                let dotColor = '#D1D5DB';
                if (emotions.length === 1) {
                    // Handle legacy 'name' or new 'id'
                    const emotionId = emotions[0].id || emotions[0].name || 'neutral';
                    dotColor = getEmotionColor(emotionId);
                } else if (emotions.length > 1) {
                    dotColor = '#A78BFA';
                }

                // If this date is ALREADY processed, we might want to merge or skip?
                // Assuming one entry per day or taking the first one found.
                // If multiple entries per day exist, we technically should merge or prioritize.
                // For now, simpler overrides are fine.

                marked[dateStr] = {
                    marked: true,
                    dotColor: dotColor,
                    customStyles: {
                        container: {
                            backgroundColor: selectedDate === dateStr ? '#1A1A2E' : 'transparent',
                            borderRadius: 12, // Always rounded if selected
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        text: {
                            color: selectedDate === dateStr ? '#FFFFFF' : '#1A1A2E',
                            fontWeight: selectedDate === dateStr ? '700' : '500',
                        }
                    }
                };
            }
        });

        // Ensure Selected Date style is applied even if no entry exists
        if (selectedDate && !marked[selectedDate]) {
            marked[selectedDate] = {
                customStyles: {
                    container: {
                        backgroundColor: '#1A1A2E',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    text: {
                        color: '#FFFFFF',
                        fontWeight: '700',
                    }
                }
            };
        }

        return marked;
    }, [entries, selectedDate]);

    const selectedDateEntries = useMemo(() => {
        if (!selectedDate) return [];
        return entries.filter(entry => {
            if (!entry.timestamp) return false;
            const entryDate = format(new Date(entry.timestamp), 'yyyy-MM-dd');
            return entryDate === selectedDate;
        });
    }, [selectedDate, entries]);

    // --- Handlers ---
    const handleDayPress = (day: DateData) => {
        const dateStr = day.dateString;
        setSelectedDate(dateStr);

        // Open modal if there are entries for this day
        const hasEntries = entries.some(entry => {
            if (!entry.timestamp) return false;
            return format(new Date(entry.timestamp), 'yyyy-MM-dd') === dateStr;
        });

        if (hasEntries) {
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
        handleDayPress,
        handleMonthChange,
        goToToday,
        getEmotionColor, // expose for UI if needed
    };
};
