// src/screens/DiaryScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenContainer, AppHeader, EmptyState, DayEntryModal, PixelCard } from '../components';
import { CalendarSkeleton } from '../components/skeleton';
import { useDiaryController } from '../controllers/useDiaryController';
import { PIXEL, PIXEL_BOLD, TYPE } from '../constants/typography';
import { CARD_GAP, SCREEN_GUTTER, SCREEN_TOP, SPACE } from '../constants/layout';
import {
  OUTLINE, PAPER, INK, INK_MUTED,
  SHADOW_OFFSET, BORDER_W_INNER,
} from '../constants/pixel';

const TODAY_ACCENT = '#4F46E5';

// Legend colours, matching the dot colours the controller marks days with.
const MOOD_COLOR = '#A78BFA';
const GREETING_COLOR = '#0099ffff';
const GOAL_COLOR = '#10B981';

// The arrow's total footprint, unchanged from the bare chevron it replaces.
// The month title only has ~188px between the two arrows and "September 2026"
// takes 173px of it, so an arrow that grew even a few px would push the title
// into wrapping -- the box is drawn INSIDE the old 20px, not around it.
const ARROW_BOX = 20;

const CALENDAR_THEME = {
  calendarBackground: PAPER,
  textSectionTitleColor: INK_MUTED,
  selectedDayBackgroundColor: INK,
  selectedDayTextColor: '#ffffff',
  todayTextColor: TODAY_ACCENT,
  dayTextColor: '#1F2937',
  textDisabledColor: '#CBD5E1',
  arrowColor: INK,
  // The calendar renders its own text, so the pixel face has to be handed to it here
  textDayFontFamily: PIXEL,
  textMonthFontFamily: PIXEL_BOLD,
  textDayHeaderFontFamily: PIXEL_BOLD,
  textDayFontSize: TYPE.bodyLg.fontSize, // 14: Silkscreen is wide -- 16 crowded the day cells
  'stylesheet.calendar.header': {
    // The library's weekday label is a 32px, single-line box. In the bold pixel
    // face at 12, "SUN" is 33px and "MON" 34.5px, so both were cut to "SU…" /
    // "MO…". Restated wholesale (like every key here) at the day-cell width, and
    // at 11, where the widest label, "MON", is 31.6px.
    dayHeader: {
      marginTop: 2,
      marginBottom: 7,
      width: 34,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: PIXEL_BOLD,
      color: INK_MUTED,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 10,
      paddingRight: 10,
      marginTop: 6,
      alignItems: 'center',
      marginBottom: 10,
    },
    // The library wraps renderHeader() in this view and ships it without a flex,
    // so it sized to the month name and carried the right arrow out of the row --
    // "September 2026" alone is wider than the space between the two arrows.
    // flex:1 pins it to the middle third; since both arrows are the same width,
    // that region is exactly centered, which is what centers the title.
    headerContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    week: {
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 5,
      // Hard rule under the weekday names, so the grid reads as a drawn table
      borderBottomWidth: BORDER_W_INNER,
      borderBottomColor: OUTLINE,
    }
  },
  // Square day cells. Each key here REPLACES the library's own wholesale, so
  // anything the default supplied (a background colour, a radius) is restated.
  'stylesheet.day.basic': {
    base: {
      // 34 outer less the 2px border each side = a 30x30 content box, which is
      // what the day number (~20px with its marginTop) and the dot row (8px) need.
      width: 34,
      height: 34,
      alignItems: 'center',
      // Every cell carries the border and only its COLOUR changes, so selecting
      // a day cannot shrink that one cell's content box and jog its number down
      // while the rest of the row stays put.
      borderWidth: BORDER_W_INNER,
      borderColor: 'transparent',
    },
    selected: {
      backgroundColor: INK,
      borderColor: OUTLINE,
      borderRadius: 0, // Replaces the library's 16 -- pixel cells are square
    },
    today: {
      backgroundColor: 'transparent',
      borderColor: TODAY_ACCENT,
      borderRadius: 0,
    },
  },
  'stylesheet.dot': {
    dot: {
      width: 6,
      height: 6,
      borderRadius: 0, // Square pips rather than round dots
      marginTop: 2,
      marginHorizontal: 1,
      // Restated deliberately: this is how the library hides the pip on an
      // unmarked day, and overriding `dot` wholesale drops it. Losing it went
      // unnoticed only because an unmarked pip has no backgroundColor to show.
      opacity: 0,
    }
  }
} as const;

export default function DiaryScreen({ navigation }: any) {
  const {
    entries,
    loading,
    refreshing,
    isError,
    selectedDate,
    seedMonth,
    calendarKey,
    modalVisible,
    setModalVisible,
    markedDates,
    selectedDateEntries,
    selectedDateGreetings,
    selectedDateGoals,
    handleDayPress,
    handleMonthChange,
    goToToday,
  } = useDiaryController();

  const handleAddFirstEntry = useCallback(() => navigation.navigate('CheckIn'), [navigation]);
  const handleCloseModal = useCallback(() => setModalVisible(false), [setModalVisible]);
  const handleEditEntry = useCallback(() => setModalVisible(false), [setModalVisible]);

  const headerRightAction = useMemo(() => ({
    label: 'Today',
    onPress: goToToday,
  }), [goToToday]);

  const renderCalendarHeader = useCallback((date: any) => {
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
  }, []);

  const renderCalendarArrow = useCallback((direction: 'left' | 'right') => (
    <View style={styles.arrowContainer}>
      <View style={styles.arrowBox}>
        {direction === 'left' ? (
          <ChevronLeft size={14} color={INK} strokeWidth={3} />
        ) : (
          <ChevronRight size={14} color={INK} strokeWidth={3} />
        )}
      </View>
    </View>
  ), []);

  return (
    <ScreenContainer variant="calm">
      <AppHeader
        title="Calendar"
        rightAction={headerRightAction}
      />

      <PixelCard padding={0} style={styles.calendarCard} wrapperStyle={styles.calendarWrapper}>
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <Calendar
            // Remounts only when the controller deliberately moves the calendar
            // (the Today button). Paging with the arrows leaves both untouched,
            // which is what keeps the month out of a parent/child feedback loop.
            key={calendarKey}
            initialDate={seedMonth}
            // Dimmed, not replaced: the grid has to stay mounted through a month
            // whose entries are still in flight, or it forgets where it was.
            style={refreshing ? styles.calendarRefreshing : undefined}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            markingType="multi-dot"
            markedDates={markedDates}
            renderHeader={renderCalendarHeader}
            theme={CALENDAR_THEME as any}
            renderArrow={renderCalendarArrow}
            enableSwipeMonths={true}
            hideExtraDays={false}
            firstDay={0}
          />
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: MOOD_COLOR }]} />
            <Text style={styles.legendText}>MOOD</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: GREETING_COLOR }]} />
            <Text style={styles.legendText}>GREETING</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: GOAL_COLOR }]} />
            <Text style={styles.legendText}>GOAL</Text>
          </View>
        </View>
      </PixelCard>

      {/* Under the grid, not instead of it: the calendar has to stay mounted to
          keep its month (see useDiaryController). React Query retries on its own
          when the app refocuses or the connection returns. */}
      {isError && !loading && (
        <EmptyState
          title="COULD NOT LOAD"
          subtitle="Some days may be missing their dots. This retries on its own when you're back online."
          style={styles.errorCard}
        />
      )}

      {/* {entries.length === 0 && (
        <EmptyState
          emoji="📔"
          title="No entries yet"
          subtitle="Start tracking your emotions to see patterns over time"
          buttonLabel="Add Your First Entry"
          onButtonPress={handleAddFirstEntry}
        />
      )} */}

      <DayEntryModal
        visible={modalVisible}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        entries={selectedDateEntries}
        greetings={selectedDateGreetings}
        goals={selectedDateGoals}
        onEditEntry={handleEditEntry}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  calendarWrapper: {
    marginTop: SCREEN_TOP,
    marginLeft: SCREEN_GUTTER,
    // Explicit rather than marginHorizontal: PixelCard reserves SHADOW_OFFSET on
    // the right, and a specific side beats the shorthand.
    marginRight: SCREEN_GUTTER + SHADOW_OFFSET,
  },
  calendarCard: {
    // Horizontal padding is deliberately tight: seven 34px day cells plus the
    // card's own borders need ~250px, which is more than a 320px-wide phone has
    // to spare at the usual 16.
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.lg,
  },
  calendarRefreshing: {
    opacity: 0.45,
  },
  errorCard: {
    marginTop: CARD_GAP,
    marginLeft: SCREEN_GUTTER,
    marginRight: SCREEN_GUTTER + SHADOW_OFFSET,
  },
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
  legend: {
    marginTop: SPACE.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.lg,
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    borderStyle: 'dotted',
    paddingTop: SPACE.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: OUTLINE,
  },
  legendText: {
    ...TYPE.caption,
  },
});
