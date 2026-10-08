import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCheckInController } from '../controllers/useCheckInController';
import { SCREEN_GUTTER, SPACE } from '../constants/layout';
import { ScreenContainer, AppHeader, BackButton, EmotionRow, PrimaryButton } from '../components';

import { EMOTIONS_CONFIG } from '../constants/emotions';
import { GOAL_TEXT } from '../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

export default function CheckInScreen({ navigation }: any) {
  const {
    updateScale,
    submitCheckIn,
    getScale,
    canSubmit
  } = useCheckInController();
  const insets = useSafeAreaInsets();

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
        // goBack, not navigate('Today'): Check In is pushed over the tabs from
        // Today and from Diary's empty state, and back should land where it came from.
        leftAction={<BackButton onPress={() => navigation.goBack()} />}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionBlock}>
          {/* Check In hands off to Reflection and nowhere else, so the two screens
              can honestly number themselves. */}
          <Text style={styles.stepEyebrow}>[ STEP 1 OF 2 ]</Text>
          <Text style={styles.instructionText}>Select emotions and rate 1-5</Text>
        </View>

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

      <View style={[styles.footer, { paddingBottom: SPACE.lg + insets.bottom }]}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  instructionBlock: {
    gap: 6,
    marginBottom: 2,
  },
  stepEyebrow: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: GOAL_TEXT, // The Continue button's green, dark enough to read as text
    letterSpacing: 2,
  },
  instructionText: {
    fontSize: 12,
    fontFamily: PIXEL,
    color: INK_MUTED,
    letterSpacing: 0.5,
  },
  footer: {
    // paddingBottom is set inline: the home-indicator inset is added to it.
    paddingTop: SPACE.lg,
    paddingHorizontal: SCREEN_GUTTER,
    // Flat rule instead of a gradient fade: the footer is a separate pixel plane
    // sitting over the scroll, and it needs a hard edge to say so.
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    backgroundColor: 'rgba(255,253,248,0.92)',
  },
});
