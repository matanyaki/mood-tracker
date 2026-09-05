// src/screens/DiaryScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenContainer, AppHeader, EmptyState, DayEntryModal } from '../components';
import { CalendarSkeleton } from '../components/Skeleton';
import { useDiaryController } from '../controllers/useDiaryController';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import {
  OUTLINE, PAPER, INK, INK_MUTED,
  SHADOW_OFFSET, BORDER_W, BORDER_W_INNER,
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
  textDayFontSize: 14, // Silkscreen is wide -- 16 crowded the day cells
  textDayHeaderFontSize: 11,
  'stylesheet.calendar.header': {
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
  } = useDiaryController();

  const handleAddFirstEntry = useCallback(() => navigation.navigate('CheckIn'), [navigation]);
  const handleCloseModal = useCallback(() => setModalVisible(false), [setModalVisible]);
  const handleEditEntry = useCallback(() => setModalVisible(false), [setModalVisible]);

  const headerRightAction = useMemo(() => ({
    label: 'Today',
    onPress: goToToday,
    style: styles.todayButton,
    textStyle: styles.todayButtonText,
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
      {/* AppHeader is shared with four other screens, so the pixel treatment is
          passed in here rather than baked into the component. */}
      <AppHeader
        title="Calendar"
        titleStyle={styles.headerTitle}
        rightAction={headerRightAction}
      />

      <View style={styles.calendarWrapper}>
        {/* Hard offset shadow: a solid block, not a blur */}
        <View style={styles.calendarShadow} pointerEvents="none" />

        <View style={styles.calendarCard}>
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <Calendar
              initialDate={currentMonth}
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
        </View>
      </View>

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
        onEditEntry={handleEditEntry}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
  },
  todayButton: {
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
    borderRadius: 0, // Overrides AppHeader's pill radius
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  todayButtonText: {
    fontSize: 11,
    color: INK,
    letterSpacing: 1,
  },
  calendarWrapper: {
    position: 'relative',
    margin: 20,
    marginRight: 20 + SHADOW_OFFSET, // Room for the offset shadow
  },
  calendarShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: OUTLINE,
    transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
  },
  calendarCard: {
    backgroundColor: PAPER,
    borderWidth: BORDER_W,
    borderColor: OUTLINE,
    // Horizontal padding is deliberately tight: seven 34px day cells plus the
    // card's own borders need ~250px, which is more than a 320px-wide phone has
    // to spare at the old 16.
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  customHeaderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  monthTitle: {
    // Silkscreen runs ~0.76em per character. The gap between the two arrows is
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
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    borderStyle: 'dotted',
    paddingTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: OUTLINE,
  },
  legendText: {
    fontSize: 10,
    fontFamily: PIXEL,
    color: INK_MUTED,
    letterSpacing: 1,
  },
});
