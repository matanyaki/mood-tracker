// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { JournalService } from '../services/journalService';
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';
import { getEmotionColor } from '../utils/emotionUtils';

export const useDiaryController = () => {
    // --- State ---
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [modalVisible, setModalVisible] = useState(false);

    // --- Data Fetching ---
    const loadData = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Use the Service we built earlier!
            const data = await JournalService.getUserEntries(user.uid);
            setEntries(data);
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
        entries.forEach(entry => {
            if (entry.timestamp) {
                const dateStr = format(new Date(entry.timestamp), 'yyyy-MM-dd');
                const emotions = entry.emotions || [];
                const primaryEmotion = entry.primaryEmotion || emotions[0]?.name || '';
                const color = getEmotionColor(primaryEmotion);

                marked[dateStr] = {
                    marked: true,
                    dotColor: color,
                    customStyles: {
                        container: {
                            backgroundColor: selectedDate === dateStr ? color + '20' : 'transparent',
                            borderRadius: 8,
                        },
                        text: {
                            color: selectedDate === dateStr ? '#1A202C' : '#374151',
                            fontWeight: selectedDate === dateStr ? '700' : '400',
                        }
                    }
                };
            }
        });

        // Mark today
        const today = format(new Date(), 'yyyy-MM-dd');
        if (!marked[today]) {
            marked[today] = {
                customStyles: {
                    container: { borderWidth: 2, borderColor: '#4F46E5', borderRadius: 8 }
                }
            };
        } else {
            marked[today].customStyles.container = {
                ...marked[today].customStyles.container,
                borderWidth: 2, borderColor: '#4F46E5',
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
        const hasEntries = entries.some(entry => {
            if (!entry.timestamp) return false;
            return format(new Date(entry.timestamp), 'yyyy-MM-dd') === dateStr;
        });
        if (hasEntries) setModalVisible(true);
    };

    const handleMonthChange = (month: DateData) => setCurrentMonth(month.dateString);

    const goToToday = () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    // --- Public Interface ---
    return {
        entries,
        loading,
        selectedDate,
        currentMonth,
        modalVisible,
        setModalVisible,
        markedDates,
        selectedDateEntries,
        getEmotionColor, // Needed for the modal UI
        handleDayPress,
        handleMonthChange,
        goToToday,
    };
};