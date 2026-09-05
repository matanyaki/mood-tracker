import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEK_ROWS = [0, 1, 2, 3];

/**
 * Stands in for the <Calendar> grid on DiaryScreen while entries and greetings
 * load — the month header, the weekday row, and six rows of day cells.
 *
 * Every box is square and sized to the real cell it replaces, so the grid does
 * not visibly resize when the calendar swaps in.
 *
 * Renders bare (no ScreenContainer / card): DiaryScreen keeps its real
 * AppHeader, calendar card and legend mounted around it, so only the table
 * itself is replaced.
 */
export default function CalendarSkeleton() {
    return (
        <View style={styles.container}>
            {/* Calendar header: arrow / month title / arrow */}
            <View style={styles.calendarHeader}>
                <SkeletonBox width={20} height={20} borderRadius={0} />
                <SkeletonBox width={150} height={20} borderRadius={0} />
                <SkeletonBox width={20} height={20} borderRadius={0} />
            </View>

            {/* Weekday name row */}
            <View style={styles.weekRow}>
                {WEEKDAYS.map(i => (
                    <SkeletonBox key={`wd-${i}`} width={24} height={13} borderRadius={0} />
                ))}
            </View>

            {/* Six rows of day cells */}
            {WEEK_ROWS.map(row => (
                <View key={`row-${row}`} style={styles.dayRow}>
                    {WEEKDAYS.map(col => (
                        <SkeletonBox
                            key={`day-${row}-${col}`}
                            width={34}
                            height={34}
                            borderRadius={0}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 6,
        marginBottom: 10,
    },
    weekRow: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 5,
    },
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
});
