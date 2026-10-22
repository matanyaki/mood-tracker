import React, { useCallback, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import PixelCard from './PixelCard';
import { PrimaryButton } from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { renderCalendarHeader, renderCalendarArrow } from './calendarParts';
import { TYPE } from '../../constants/typography';
import { SCREEN_GUTTER, SPACE } from '../../constants/layout';
import { CALENDAR_THEME } from '../../constants/calendarTheme';

/** Narrower than the Diary's card: a pop-up over a form, not a screen of its own. */
const MAX_WIDTH = 320;

/** A 'YYYY-MM-DD' moved by whole days. parseISO reads a bare date as LOCAL midnight. */
const shiftDay = (date: string, days: number) => format(addDays(parseISO(date), days), 'yyyy-MM-dd');

/** The Sunday that starts a day's week, matching the calendar's firstDay={0}. */
const weekStartOf = (date: string) => format(startOfWeek(parseISO(date)), 'yyyy-MM-dd');

interface CalendarPickerModalProps {
    visible: boolean;
    /** Above the grid, e.g. "END DATE". */
    title: string;
    /** The days picked so far, 'YYYY-MM-DD'. */
    selected: string[];
    /** Days before it are greyed out and cannot be tapped, or cleared. */
    minDate?: string;
    /**
     * Pick any number of days and confirm with DONE, instead of one tap that closes.
     * Adds COPY WEEK and CLEAR MONTH, for laying out many weeks without tapping each day.
     */
    multiple?: boolean;
    onSelect: (dates: string[]) => void;
    onClose: () => void;
}

/**
 * A calendar in a pop-up, for picking one day or several. Drawn with the Diary's
 * theme, header and arrows, so it reads as the same calendar -- but with no dots:
 * the only thing marked is what is picked.
 *
 * Single mode commits on the tap and closes. Multiple mode toggles days in a draft
 * and commits on DONE; closing any other way drops the draft.
 *
 * In multiple mode, COPY WEEK adds the picks in the week of the last day tapped to
 * the week after it, then moves on to that week, so pressing it again keeps
 * filling the weeks ahead. It only adds: a pick already in the next week stays.
 * CLEAR MONTH removes the picks in the month on screen, except days before
 * minDate, which cannot be changed at all.
 */
export default function CalendarPickerModal({
    visible,
    title,
    selected,
    minDate,
    multiple = false,
    onSelect,
    onClose,
}: CalendarPickerModalProps) {
    const { width: windowWidth } = useWindowDimensions();

    const seedFor = () => [...selected].sort()[0] ?? minDate ?? format(new Date(), 'yyyy-MM-dd');

    // The month the calendar opens on. Seeded once per opening and then left alone:
    // <Calendar> re-seeds from `initialDate` whenever it changes, and that re-seed
    // fires onMonthChange -- a value that moved on every tap would page the calendar
    // back under the user's finger, and one fed from onMonthChange loops outright
    // (the "Maximum update depth" useDiaryController documents).
    const [seed, setSeed] = useState(seedFor);
    const [draft, setDraft] = useState<string[]>(selected);
    // The week COPY WEEK copies from: the last day tapped, then each week it copied into.
    const [copyFrom, setCopyFrom] = useState<string | null>(null);
    // 'YYYY-MM' on screen, for CLEAR MONTH. Only ever read from onMonthChange, never
    // passed back into initialDate -- that is the loop `seed` exists to avoid.
    const [visibleMonth, setVisibleMonth] = useState(() => seed.slice(0, 7));

    // Each opening starts from what the caller holds, not from the last abandoned
    // draft. Reset during render rather than in an effect, so the calendar never
    // mounts with the previous opening's month and then jumps.
    const [wasVisible, setWasVisible] = useState(false);
    if (visible !== wasVisible) {
        setWasVisible(visible);
        if (visible) {
            const nextSeed = seedFor();
            setSeed(nextSeed);
            setDraft(selected);
            setCopyFrom(null);
            setVisibleMonth(nextSeed.slice(0, 7));
        }
    }

    const handleDayPress = useCallback((day: DateData) => {
        const date = day.dateString;
        if (!multiple) {
            onSelect([date]);
            onClose();
            return;
        }
        setDraft(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
        setCopyFrom(date);
    }, [multiple, onSelect, onClose]);

    const handleMonthChange = useCallback((month: DateData) => {
        setVisibleMonth(month.dateString.slice(0, 7));
    }, []);

    const handleCopyWeek = () => {
        if (!copyFrom) return;
        const from = weekStartOf(copyFrom);
        const to = shiftDay(from, 7);
        setDraft(prev => {
            const copies = prev
                .filter(date => date >= from && date < to)
                .map(date => shiftDay(date, 7));
            return [...new Set([...prev, ...copies])];
        });
        setCopyFrom(shiftDay(copyFrom, 7));
    };

    // Days before minDate are locked, so they are left in place.
    const isClearable = (date: string) => date.startsWith(visibleMonth) && (!minDate || date >= minDate);
    const handleClearMonth = () => setDraft(prev => prev.filter(date => !isClearable(date)));

    const handleDone = () => {
        onSelect([...draft].sort());
        onClose();
    };

    const markedDates = useMemo(() => {
        const days = multiple ? draft : selected;
        return Object.fromEntries(days.map(date => [date, { selected: true }]));
    }, [multiple, draft, selected]);

    const dialogWidth = Math.min(windowWidth - 2 * SCREEN_GUTTER, MAX_WIDTH);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* A sibling under the card, not a wrapper around it: a wrapping
                    Pressable would also take taps on the card's own padding and
                    title, and close the picker out from under them. */}
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                />

                <PixelCard padding={0} style={styles.card} wrapperStyle={{ width: dialogWidth }}>
                    <Text style={styles.title}>{title}</Text>

                    <Calendar
                        initialDate={seed}
                        minDate={minDate}
                        // The library still fires onDayPress for a greyed-out day
                        // unless told not to.
                        disableAllTouchEventsForDisabledDays
                        onDayPress={handleDayPress}
                        onMonthChange={handleMonthChange}
                        markedDates={markedDates}
                        renderHeader={renderCalendarHeader}
                        theme={CALENDAR_THEME as any}
                        renderArrow={renderCalendarArrow}
                        enableSwipeMonths={true}
                        hideExtraDays={false}
                        firstDay={0}
                    />

                    {/* Spaced by a wrapper: PrimaryButton's `style` lands on its face,
                        and a margin there would slide the face off its shadow. */}
                    {multiple && (
                        <View style={styles.done}>
                            <View style={styles.tools}>
                                <SecondaryButton
                                    label="COPY WEEK"
                                    onPress={handleCopyWeek}
                                    disabled={!copyFrom}
                                    style={styles.tool}
                                    accessibilityLabel="Copy this week's picks to the next week"
                                />
                                <SecondaryButton
                                    label="CLEAR MONTH"
                                    onPress={handleClearMonth}
                                    disabled={!draft.some(isClearable)}
                                    style={styles.tool}
                                    accessibilityLabel="Clear the picks in this month"
                                />
                            </View>
                            <PrimaryButton label="DONE" onPress={handleDone} />
                        </View>
                    )}
                </PixelCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // The same flat dim as PixelAlert and the PixelSelect panel.
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    card: {
        // The Diary card's padding, for the same reason: seven 34px day cells plus
        // the borders need ~250px, and a narrow phone has little to spare.
        paddingHorizontal: SPACE.sm,
        paddingVertical: SPACE.lg,
    },
    title: {
        ...TYPE.h2,
        paddingHorizontal: SPACE.sm,
        marginBottom: SPACE.sm,
    },
    done: {
        marginTop: SPACE.lg,
        marginHorizontal: SPACE.sm,
        gap: SPACE.md,
    },
    tools: {
        flexDirection: 'row',
        gap: SPACE.sm,
    },
    tool: {
        flex: 1,
        // Narrower than the default SPACE.lg: "CLEAR MONTH" is ~111px of Silkscreen,
        // and half the card leaves ~140. The label is centred, so the face looks the same.
        paddingHorizontal: SPACE.sm,
    },
});
