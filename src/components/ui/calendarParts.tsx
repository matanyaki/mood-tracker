// The month title and arrows every react-native-calendars <Calendar> in the app
// draws, passed as its renderHeader and renderArrow. Plain functions rather than
// components: the calendar calls them, and being module-level they are stable.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { PIXEL_BOLD } from '../../constants/typography';
import { SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, INK, BORDER_W_INNER } from '../../constants/pixel';
import { ARROW_BOX } from '../../constants/calendarTheme';

export function renderCalendarHeader(date: any) {
    const headerDate = new Date(date);
    return (
        <View style={styles.customHeaderContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.monthTitle}>
                    {format(headerDate, 'MMMM yyyy')}
                </Text>
            </View>
        </View>
    );
}

export function renderCalendarArrow(direction: 'left' | 'right') {
    return (
        <View style={styles.arrowContainer}>
            <View style={styles.arrowBox}>
                {direction === 'left' ? (
                    <ChevronLeft size={14} color={INK} strokeWidth={3} />
                ) : (
                    <ChevronRight size={14} color={INK} strokeWidth={3} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    customHeaderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACE.xs,
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
    },
    monthTitle: {
        // A documented exception to the type scale. The gap between the two arrows is
        // ~188px on a narrow phone, and "September 2026" is the widest month label:
        // 173px at this size, 207px at 18. Left in sentence case and without extra
        // letterSpacing for the same reason -- there is no room for either.
        fontSize: 15,
        fontFamily: PIXEL_BOLD,
        color: INK,
        textAlign: 'center',
    },
    arrowContainer: {
        // No padding of our own: the library already wraps each arrow in a
        // TouchableOpacity with padding:10 and a 20px hitSlop, and those 8px were
        // coming straight out of the month title's room.
        padding: 0,
    },
    arrowBox: {
        width: ARROW_BOX,
        height: ARROW_BOX,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
});
