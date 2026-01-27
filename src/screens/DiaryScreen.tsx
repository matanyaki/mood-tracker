// src/screens/DiaryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight, X, Edit } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, LoadingState, EmptyState } from '../components';
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

  const renderDayDetailModal = () => {
    if (selectedDateEntries.length === 0) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalDate}>
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedDateEntries.map((entry) => {
                const emotions = entry.emotions || [];
                const primaryEmotion = entry.primaryEmotion || emotions[0]?.name || 'Unknown';
                const color = getEmotionColor(primaryEmotion);

                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={[styles.entryColorBar, { backgroundColor: color }]} />
                    <View style={styles.entryContent}>
                      <Text style={styles.entryTime}>
                        {format(new Date(entry.timestamp), 'h:mm a')}
                      </Text>

                      <View style={styles.primaryEmotionRow}>
                        <View style={[styles.emotionDot, { backgroundColor: color }]} />
                        <Text style={styles.primaryEmotionText}>{primaryEmotion}</Text>
                      </View>

                      {emotions.length > 0 && (
                        <View style={styles.emotionChips}>
                          {emotions.map((e: any, idx: number) => (
                            <View key={idx} style={styles.emotionChip}>
                              <Text style={styles.emotionChipText}>{e.name || 'Unknown'}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {emotions[0]?.note && (
                        <View style={styles.noteContainer}>
                          <Text style={styles.noteLabel}>Note:</Text>
                          <Text style={styles.noteText}>{emotions[0].note}</Text>
                        </View>
                      )}

                      {/* --- NEW: AI Feedback Section --- */}
                      {entry.aiFeedback ? (
                        <View style={styles.aiBox}>
                          <Text style={styles.aiLabel}>✨ AI Insight:</Text>
                          <Text style={styles.aiText}>{entry.aiFeedback}</Text>
                        </View>
                      ) : null}
                      {/* -------------------------------- */}

                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setModalVisible(false);
                          // navigation.navigate('EditEntry', { entryId: entry.id });
                        }}
                      >
                        <Edit size={16} color="#4F46E5" />
                        <Text style={styles.editButtonText}>Edit Entry</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <View style={styles.modalBottomPadding} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
            dayTextColor: '#1A202C',
            textDisabledColor: '#D1D5DB',
            monthTextColor: '#1A202C',
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

      {renderDayDetailModal()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  calendarContainer: { margin: 20 },
  legend: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8ECEF' },
  legendTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  legendItems: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendSquare: { width: 10, height: 10, borderWidth: 2, borderRadius: 2 },
  legendText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8ECEF' },
  modalHeaderLeft: { flex: 1 },
  modalDate: { fontSize: 20, fontWeight: '700', color: '#1A202C' },
  closeButton: { padding: 4 },
  modalScroll: { paddingHorizontal: 24 },
  modalBottomPadding: { height: 40 },
  entryCard: { backgroundColor: '#F8FAFB', borderRadius: 12, marginTop: 16, flexDirection: 'row', overflow: 'hidden' },
  entryColorBar: { width: 5 },
  entryContent: { flex: 1, padding: 16 },
  entryTime: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  primaryEmotionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emotionDot: { width: 12, height: 12, borderRadius: 6 },
  primaryEmotionText: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  emotionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  emotionChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E8ECEF' },
  emotionChipText: { fontSize: 13, color: '#4A5568', fontWeight: '600' },
  noteContainer: { marginBottom: 12 },
  noteLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  noteText: { fontSize: 14, color: '#374151', fontStyle: 'italic', lineHeight: 20 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8 },
  editButtonText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },

  // --- NEW STYLES FOR AI BOX ---
  aiBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F9FF', // Light blue background
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
    marginBottom: 12
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4
  },
  aiText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18
  }
});