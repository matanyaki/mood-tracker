// src/controllers/useDiaryController.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { DateData } from 'react-native-calendars';

import { useEntriesQuery } from '../hooks/useEntriesQuery';
import { useGreetingsQuery } from '../hooks/useGreetingsQuery';
import { useGoalsQuery, useGoalCompletionsQuery } from '../hooks/useGoalsQuery';
import { getEmotionColor } from '../constants/colors';
import { isGoalScheduledOn, goalDayStatus } from '../../shared/types';
import type { Goal, GoalDayStatus } from '@shared/types';

// Stable identities so the memos below don't recompute while a query is pending.
const NO_ENTRIES: NonNullable<ReturnType<typeof useEntriesQuery>['data']> = [];
const NO_GREETINGS: NonNullable<ReturnType<typeof useGreetingsQuery>['data']> = [];
const NO_GOALS: NonNullable<ReturnType<typeof useGoalsQuery>['data']> = [];
const NO_COMPLETIONS: NonNullable<ReturnType<typeof useGoalCompletionsQuery>['data']> = {};

/** One goal on one day, with what became of it. What the day sheet renders. */
export type ScheduledGoal = { goal: Goal; status: GoalDayStatus };

const NO_SCHEDULED_GOALS: ScheduledGoal[] = [];

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

    // The month the grid is ACTUALLY showing. The calendar owns it; this only
    // follows along, because it is what the queries below key off.
    const [currentMonth, setCurrentMonth] = useState(() => monthStart(format(new Date(), 'yyyy-MM-dd')));

    /**
     * The month the calendar is SEEDED with, which is a different thing.
     *
     * <Calendar> keeps its own month in state and re-seeds it from `initialDate`
     * in an effect -- with `parseDate()`, which returns a fresh XDate every call,
     * so the seed always counts as a change and always re-fires onMonthChange.
     * Feeding the month it reports back in as `initialDate` therefore closes a
     * loop: press -> onMonthChange -> setState -> re-seed -> onMonthChange, and
     * every remount of the calendar starts the cascade again from the top. That
     * is the "Maximum update depth exceeded" the arrows were throwing.
     *
     * So the seed is held apart and never written from onMonthChange. It moves
     * only when WE move the calendar (goToToday), and the nonce is what makes
     * that stick: the seed is an initial value, so the only way to re-apply one
     * is to mount a fresh calendar, which the nonce does as its key.
     */
    const [seedMonth, setSeedMonth] = useState(() => ({
        month: monthStart(format(new Date(), 'yyyy-MM-dd')),
        nonce: 0,
    }));

    const [modalVisible, setModalVisible] = useState(false);

    /**
     * Today, as the 'YYYY-MM-DD' the goal statuses are measured against.
     *
     * Read once per mount rather than per render, so a re-render can't reclassify a
     * day mid-session. It does mean a screen left open across midnight keeps
     * yesterday's idea of "today" until the Diary is revisited -- the same trade the
     * Today button already makes, and the same one every other date read here makes.
     */
    const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));

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

    // Goals are fetched unscoped, like greetings: a goal is a window and a set of
    // weekdays rather than a dated record, so there is no month to ask for -- the
    // days it falls on are derived below.
    const goalsQuery = useGoalsQuery();

    // The days actually marked done, which is what separates a kept day from a
    // missed one. Fetched whole rather than per goal: the grid decides the status of
    // every scheduled day on screen at once.
    const completionsQuery = useGoalCompletionsQuery();

    // Neighbour months are additive, so they must not gate the calendar render --
    // loading stays tied to the month actually being displayed.
    const entries = useMemo(() => [
        ...(prevEntriesQuery.data ?? NO_ENTRIES),
        ...(entriesQuery.data ?? NO_ENTRIES),
        ...(nextEntriesQuery.data ?? NO_ENTRIES),
    ], [prevEntriesQuery.data, entriesQuery.data, nextEntriesQuery.data]);

    const greetings = greetingsQuery.data ?? NO_GREETINGS;
    const goals = goalsQuery.data ?? NO_GOALS;
    const completions = completionsQuery.data ?? NO_COMPLETIONS;
    // Goals join the gate for the same reason greetings do: they draw dots on the
    // month being displayed, so letting the grid render first only means pips
    // appearing on days the user has already looked at. The neighbour entry queries
    // stay out of it -- those are for cells outside this month.
    const fetching = entriesQuery.isLoading || greetingsQuery.isLoading || goalsQuery.isLoading || completionsQuery.isLoading;

    /**
     * The skeleton stands in for the FIRST paint only.
     *
     * ['entries', month] is a new key every month, so isLoading goes true again on
     * any month the prefetch hasn't landed for yet -- which is exactly what paging
     * back faster than the network does. Swapping the grid out for a skeleton there
     * unmounts <Calendar>, and a calendar that unmounts loses the month it was on,
     * drops the taps aimed at the arrow that is no longer there, and comes back
     * re-seeded. Once the grid exists it stays mounted; a month still in flight is
     * said with `refreshing` instead.
     */
    const paintedOnce = useRef(false);
    useEffect(() => {
        if (!fetching) paintedOnce.current = true;
    }, [fetching]);

    const loading = fetching && !paintedOnce.current;
    const refreshing = fetching && paintedOnce.current;

    /**
     * Which goals fall on each day the grid can show, and what became of each one,
     * as 'YYYY-MM-DD' -> [{ goal, status }].
     *
     * Built by walking the window rather than by reading stored dates, because a
     * goal has none: it stores a range and a set of weekdays. The window runs from
     * the 1st of the previous month to the last of the next one, which is every
     * cell `hideExtraDays={false}` can put on screen -- the same reason the two
     * neighbouring entry queries above exist.
     *
     * Every day in the window is walked, not just the days up to today: a goal is
     * scheduled for its whole range, so the days still ahead of it are as much a
     * part of the diary as the ones behind. Nothing filters on a goal's end date
     * either -- a goal that finished last month still has to account for the days it
     * covered, which is the whole point of showing them as kept or missed.
     */
    const goalsByDate = useMemo(() => {
        const byDate: Record<string, ScheduledGoal[]> = {};
        if (goals.length === 0) return byDate;

        const [startYear, startMonthNo] = shiftMonth(monthParam, -1).split('-').map(Number);
        const [endYear, endMonthNo] = shiftMonth(monthParam, 1).split('-').map(Number);

        // Local midnight, built from parts: a parsed 'YYYY-MM-01' would be UTC
        // midnight and land on the previous month west of Greenwich.
        const cursor = new Date(startYear, startMonthNo - 1, 1);
        const windowEnd = new Date(endYear, endMonthNo, 0); // Day 0 = last of that month

        while (cursor <= windowEnd) {
            const dateStr = format(cursor, 'yyyy-MM-dd');
            const due = goals
                .filter(goal => isGoalScheduledOn(goal, dateStr))
                .map(goal => ({
                    goal,
                    // A goal with nothing marked has no key in the map at all, which
                    // reads the same as an empty list: no day of it was ever kept.
                    status: goalDayStatus(dateStr, today, (completions[goal.id!] ?? []).includes(dateStr)),
                }));

            if (due.length > 0) {
                byDate[dateStr] = due;
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        return byDate;
    }, [goals, completions, today, monthParam]);

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

        // Add goal dots
        Object.keys(goalsByDate).forEach(dateStr => {
            if (!marked[dateStr]) {
                marked[dateStr] = { dots: [] };
            }

            // One dot however many goals are due: the pip says "something is
            // scheduled", and three of them in a 30px cell would say nothing at all.
            if (!marked[dateStr].dots.some((d: any) => d.key === 'goal')) {
                marked[dateStr].dots.push({ key: 'goal', color: '#10B981' });
            }
        });

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
    }, [entries, greetings, goalsByDate, selectedDate]);

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

    // Read straight out of the index the dots were drawn from, so the sheet can
    // never disagree with the pip that invited the tap.
    const selectedDateGoals = useMemo(() => {
        if (!selectedDate) return NO_SCHEDULED_GOALS;
        return goalsByDate[selectedDate] ?? NO_SCHEDULED_GOALS;
    }, [selectedDate, goalsByDate]);

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

        const hasGoals = !!goalsByDate[dateStr];

        if (hasEntries || hasGreetings || hasGoals) {
            setModalVisible(true);
        }
    }, [entries, greetings, goalsByDate]);

    // Reports the month the calendar moved itself to, and stops there -- writing it
    // back into the seed is what closed the loop documented on seedMonth. The
    // same-value check is for the report the calendar makes on mount, which
    // restates the month it was seeded with.
    const handleMonthChange = useCallback((month: DateData) => {
        const next = monthStart(month.dateString);
        setCurrentMonth(prev => (prev === next ? prev : next));
    }, []);

    const goToToday = useCallback(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const month = monthStart(today);

        setCurrentMonth(month);
        setSelectedDate(today);
        // Always a new nonce, even when the seed month is unchanged: the calendar
        // may have been paged away from it since, and the seed alone would then be
        // a value it has already consumed.
        setSeedMonth(prev => ({ month, nonce: prev.nonce + 1 }));
    }, []);

    return {
        entries,
        loading,
        refreshing,
        selectedDate,
        currentMonth,
        // What <Calendar> is mounted with: the seed, plus the key that re-mounts it.
        seedMonth: seedMonth.month,
        calendarKey: seedMonth.nonce,
        modalVisible,
        setModalVisible,
        markedDates,
        selectedDateEntries,
        selectedDateGreetings,
        selectedDateGoals,
        handleDayPress,
        handleMonthChange,
        goToToday,
        getEmotionColor, // expose for UI if needed
    };
};
