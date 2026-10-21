// src/screens/DiaryScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer, AppHeader, EmptyState, DayEntryModal, PixelCard, PixelCalendar } from '../components';
import { CalendarSkeleton } from '../components/skeleton';
import { useDiaryController } from '../controllers/useDiaryController';
import { TYPE } from '../constants/typography';
import { CARD_GAP, SCREEN_GUTTER, SCREEN_TOP, SPACE } from '../constants/layout';
import { OUTLINE, SHADOW_OFFSET, BORDER_W_INNER } from '../constants/pixel';

// Legend colours, matching the dot colours the controller marks days with.
const MOOD_COLOR = '#A78BFA';
const GREETING_COLOR = '#0099ffff';
const GOAL_COLOR = '#10B981';

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
          <PixelCalendar
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
