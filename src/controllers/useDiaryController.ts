// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';

import { useEntriesQuery } from '../hooks/useEntriesQuery';
import { useGreetingsQuery } from '../hooks/useGreetingsQuery';
import { getEmotionColor } from '../constants/colors';

// Stable identities so the memos below don't recompute while a query is pending.
const NO_ENTRIES: NonNullable<ReturnType<typeof useEntriesQuery>['data']> = [];
const NO_GREETINGS: NonNullable<ReturnType<typeof useGreetingsQuery>['data']> = [];

/**
 * Pins a 'YYYY-MM-DD' string to the first of its month.
 *
 * currentMonth drives two things at once — the calendar's visible month and the
 * ['entries', month] query key — so it is normalized to month granularity. Sliced
 * rather than re-parsed: new Date('2026-09-01') is UTC midnight, which lands on
 * August in any negative-offset timezone.
 */
const monthStart = (dateStr: string) => `${dateStr.substring(0, 7)}-01`;

/**
 * Shifts a 'YYYY-MM' string by whole months.
 *
 * Kept in string arithmetic for the same timezone reason as monthStart: parsing
 * to a Date to call setMonth would reintroduce the UTC-midnight off-by-one.
 */
const shiftMonth = (month: string, delta: number) => {
    const [year, monthNo] = month.split('-').map(Number);
    const absolute = year * 12 + (monthNo - 1) + delta;
    return `${String(Math.floor(absolute / 12)).padStart(4, '0')}-${String((absolute % 12) + 1).padStart(2, '0')}`;
};

export const useDiaryController = () => {
    // --- State ---
    const [selectedDate, setSelectedDate] = useState('');
    const [currentMonth, setCurrentMonth] = useState(() => monthStart(format(new Date(), 'yyyy-MM-dd')));
    const [modalVisible, setModalVisible] = useState(false);

    // --- Data Fetching ---
    // Same ['entries', month] key InsightsScreen reads, so visiting both screens on
    // the same month costs one request, and returning within staleTime costs none.
    const monthParam = currentMonth.substring(0, 7); // Format: 'YYYY-MM'
    const entriesQuery = useEntriesQuery(monthParam);
    const greetingsQuery = useGreetingsQuery();

    // hideExtraDays={false} means the grid also shows the tail of the previous
    // month and the head of the next one. Greetings are fetched unscoped, so those
    // cells already got greeting dots; entries are scoped to ['entries', month],
    // so without the neighbours the same cells stayed blank of mood dots.
    // The extra fetches are also a free prefetch: paging to an adjacent month
    // finds it already cached.
    const prevEntriesQuery = useEntriesQuery(shiftMonth(monthParam, -1));
    const nextEntriesQuery = useEntriesQuery(shiftMonth(monthParam, 1));

    // Neighbour months are additive, so they must not gate the calendar render --
    // loading stays tied to the month actually being displayed.
    const entries = useMemo(() => [
        ...(prevEntriesQuery.data ?? NO_ENTRIES),
        ...(entriesQuery.data ?? NO_ENTRIES),
        ...(nextEntriesQuery.data ?? NO_ENTRIES),
    ], [prevEntriesQuery.data, entriesQuery.data, nextEntriesQuery.data]);

    const greetings = greetingsQuery.data ?? NO_GREETINGS;
    const loading = entriesQuery.isLoading || greetingsQuery.isLoading;

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

    const handleMonthChange = useCallback((month: DateData) => setCurrentMonth(monthStart(month.dateString)), []);

    const goToToday = useCallback(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setCurrentMonth(monthStart(today));
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
