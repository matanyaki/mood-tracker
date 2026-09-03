// src/screens/DiaryScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, EmptyState, DayEntryModal } from '../components';
import { CalendarSkeleton } from '../components/Skeleton';
import { useDiaryController } from '../controllers/useDiaryController';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';

const CALENDAR_THEME = {
  calendarBackground: '#fff',
  textSectionTitleColor: '#9CA3AF',
  selectedDayBackgroundColor: '#1A1A2E',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#4F46E5',
  dayTextColor: '#1F2937',
  textDisabledColor: '#E5E7EB',
  arrowColor: '#1A1A2E',
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
    week: {
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 5,
      borderBottomWidth: 0,
    }
  },
  'stylesheet.dot': {
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 2
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
    onPress: goToToday
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
      {direction === 'left' ? (
        <ChevronLeft size={20} color="#1A1A2E" strokeWidth={2.5} />
      ) : (
        <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />
      )}
    </View>
  ), []);

  return (
    <ScreenContainer variant="calm">
      <AppHeader
        title="Calendar"
        rightAction={headerRightAction}
      />

      <Card style={styles.calendarContainer} padding={16} elevation={4} borderRadius={24}>
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
            <View style={[styles.legendDot, { backgroundColor: '#A78BFA' }]} />
            <Text style={styles.legendText}>Mood</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0099ffff' }]} />
            <Text style={styles.legendText}>Greeting</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Goal</Text>
          </View>
        </View>
      </Card>

      {/* {entries.length === 0 && (
        <EmptyState
          emoji="📔"
          title="No entries yet"
          subtitle="Start tracking your emotions to see patterns over time"
          buttonLabel="Add Your First Entry"
          onButtonPress={handleAddFirstEntry}
        />
      )} */}

      {/* 
        Ensure DayEntryModal is updated to use new image constants if it displays images. 
        I will assume it uses EntryEmotionsList.
      */}
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
  calendarContainer: {
    margin: 20,
    backgroundColor: '#fff',
  },
  customHeaderContainer: {
    // Sits between the calendar's two arrows in a space-between row. Without flex
    // it sizes to the month name, and a long one ("September 2026") shoves the
    // arrows outward -- the same defect the day modal's close button had.
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthTitle: {
    // Silkscreen runs ~0.76em per character, so 22px put "September 2026" at 253px
    // against ~216px of room on a narrow phone.
    fontSize: 18,
    fontFamily: PIXEL_BOLD,
    color: '#1A1A2E',
  },
  arrowContainer: {
    padding: 4,
  },
  legend: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 3
  },
  legendText: {
    fontSize: 12,
    fontFamily: PIXEL,
    color: '#6B7280',
  },
});
