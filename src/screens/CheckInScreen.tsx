import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCheckInController } from '../controllers/useCheckInController';
import { ScreenContainer, AppHeader, EmotionRow, PrimaryButton } from '../components';

import { EMOTIONS_CONFIG } from '../constants/emotions';
export default function CheckInScreen({ navigation }: any) {
  const {
    updateScale,
    submitCheckIn,
    getScale,
    canSubmit
  } = useCheckInController();

  const handleComplete = useCallback(() => {
    const data = submitCheckIn();
    if (data) {
      // Pass selections to Reflection Screen
      navigation.navigate('Reflection', { selections: data });
    }
  }, [submitCheckIn, navigation]);

  const handleScaleChange = useCallback((id: string, label: string, val: number) => {
    updateScale(id, label, val);
  }, [updateScale]);

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        emoji="💭"
        title="Check In"
        subtitle="How are you feeling today?"
        style={styles.header}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          Select emotions and rate intensity (1-5)
        </Text>

        {EMOTIONS_CONFIG.map((emotion) => (
          <EmotionRow
            key={emotion.id}
            id={emotion.id}
            label={emotion.label}
            imageKey={emotion.imageKey}
            currentScale={getScale(emotion.id)}
            onScaleChange={handleScaleChange}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={canSubmit ? 'Continue to Reflection' : 'Select at least one emotion'}
          onPress={handleComplete}
          disabled={!canSubmit}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: 30, // Extra padding for bottom safe area
  },
});
