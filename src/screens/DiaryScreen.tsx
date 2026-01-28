// src/screens/DiaryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight, X, Edit } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, LoadingState, EmptyState, DayEntryModal } from '../components';
import { useDiaryController } from '../controllers/useDiaryController';

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
    getEmotionColor,
    handleDayPress,
    handleMonthChange,
    goToToday,
  } = useDiaryController();



  if (loading) {
    return (
      <ScreenContainer variant="calm">
        <LoadingState fullScreen />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer variant="calm">
      <AppHeader
        title="Your Journal"
        subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} total`}
        rightAction={{ label: 'Today', onPress: goToToday }}
      />

      <Card style={styles.calendarContainer} padding={16} elevation={4}>
        <Calendar
          current={currentMonth}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markingType="custom"
          markedDates={markedDates}
          theme={{
            calendarBackground: '#fff',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#4F46E5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4F46E5',
            dayTextColor: '#4A4A4A',
            textDisabledColor: '#D1D5DB',
            monthTextColor: '#1A1A2E',
            textMonthFontWeight: '700',
            textMonthFontSize: 20,
            textDayFontSize: 16,
            textDayHeaderFontSize: 14,
            textDayHeaderFontWeight: '600',
            arrowColor: '#4F46E5',
          }}
          renderArrow={(direction) => (
            direction === 'left' ?
              <ChevronLeft size={24} color="#4F46E5" strokeWidth={2.5} /> :
              <ChevronRight size={24} color="#4F46E5" strokeWidth={2.5} />
          )}
          enableSwipeMonths={true}
          hideExtraDays={false}
          firstDay={0}
        />

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4F46E5' }]} />
              <Text style={styles.legendText}>Has entry</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSquare, { borderColor: '#4F46E5' }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </Card>

      {entries.length === 0 && (
        <EmptyState
          emoji="📔"
          title="No entries yet"
          subtitle="Start tracking your emotions to see patterns over time"
          buttonLabel="Add Your First Entry"
          onButtonPress={() => navigation.navigate('CheckIn')}
        />
      )}

      <DayEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
        entries={selectedDateEntries}
        onEditEntry={(entry) => {
          setModalVisible(false);
          // navigation.navigate('EditEntry', { entryId: entry.id });
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  calendarContainer: { margin: 20 },
  legend: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8ECEF' },
  legendTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  legendItems: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendSquare: { width: 10, height: 10, borderWidth: 2, borderRadius: 2 },
  legendText: { fontSize: 16, color: '#4A4A4A', fontWeight: '500' },
});