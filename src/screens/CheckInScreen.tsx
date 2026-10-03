import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useCheckInController } from '../controllers/useCheckInController';
import { ScreenContainer, AppHeader, EmotionRow, PrimaryButton } from '../components';

import { EMOTIONS_CONFIG } from '../constants/emotions';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

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
      {/* AppHeader is shared with Diary/Insights/Profile/Today, so the pixel
          treatment is passed in per-screen rather than baked into the component. */}
      <AppHeader
        emoji="💭"
        title="Check In"
        subtitle="How are you feeling today?"
        style={styles.header}
        titleStyle={styles.headerTitle}
        subtitleStyle={styles.headerSubtitle}
        // goBack, not navigate('Today'): Check In is pushed over the tabs from
        // Today and from Diary's empty state, and back should land where it came from.
        leftAction={
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={8}
          >
            <ArrowLeft color={INK} size={20} strokeWidth={2.5} />
          </Pressable>
        }
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
    // The emoji + two-line title is taller than the back button, so centre the
    // button against it rather than pinning it to the top edge.
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
  },
  headerSubtitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: INK_MUTED,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
  },
  backButtonPressed: {
    // Sinks toward its own corner, matching how PrimaryButton answers a press.
    transform: [{ translateX: 1 }, { translateY: 1 }],
    backgroundColor: '#EDE9E0',
  },
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
    color: '#10B981', // Matches the Continue button -- the eyebrow points at it
    letterSpacing: 2,
  },
  instructionText: {
    fontSize: 12,
    fontFamily: PIXEL,
    color: INK_MUTED,
    letterSpacing: 0.5,
  },
  footer: {
    padding: 20,
    paddingBottom: 30, // Extra padding for bottom safe area
    // Flat rule instead of a gradient fade: the footer is a separate pixel plane
    // sitting over the scroll, and it needs a hard edge to say so.
    borderTopWidth: BORDER_W_INNER,
    borderTopColor: OUTLINE,
    backgroundColor: 'rgba(255,253,248,0.92)',
  },
});
