import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, ReflectionCard, PrimaryButton } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';
import { getEmotionColor } from '../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { PAPER, INK, INK_MUTED } from '../constants/pixel';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave
  } = useReflectionController(route, navigation);

  // Which emotion is on screen. Pure presentation, so it lives here rather than in
  // the controller: notes stay keyed by emotion id there, and Save still sends all
  // of them at once. Steps follow `selections`, i.e. the order they were tapped in.
  const [step, setStep] = useState(0);
  const current = selections[step];
  const isLastStep = step === selections.length - 1;

  return (
    <ScreenContainer variant="focus">
      <AppHeader
        title="Reflect"
        leftAction={<BackButton onPress={() => navigation.goBack()} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* `handled` so Next / Save fire on the first tap while the keyboard is
            open, instead of that tap only dismissing it. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introBlock}>
            {/* Reflection is only ever reached from Check In's Continue button. */}
            <Text style={styles.stepEyebrow}>[ STEP 2 OF 2 ]</Text>
            <Text style={styles.subtitle}>Take a moment to write about your feelings.</Text>
          </View>

          {/* One segment per selected emotion: done ones filled, the current one in
              its emotion's colour (the same as the card's accent bar), the rest dim. */}
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              {selections.map((item: any, index: number) => (
                <View
                  key={item.id}
                  style={[
                    styles.progressSegment,
                    index < step && styles.progressSegmentDone,
                    index === step && { backgroundColor: getEmotionColor(item.id) },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressCount}>{step + 1} / {selections.length}</Text>
          </View>

          {/* No `key`: the same card and TextInput stay mounted from step to step, so
              an open keyboard stays open instead of dropping and re-rising. */}
          <ReflectionCard
            label={current.label}
            rootEmotionId={current.id}
            note={notes[current.id] || ''}
            onChangeText={handleTextChange}
            isLast={isLastStep}
          />

          {/* Sits directly under the card as two standalone pixel blocks, each with
              its own outline and hard shadow. Both PrimaryButton and ReflectionCard
              give up SHADOW_OFFSET on the right, so the faces line up edge to edge. */}
          <View style={styles.navRow}>
            {/* Hidden on the first step rather than disabled: with a single emotion
                this leaves just Save. */}
            {step > 0 && (
              <View style={styles.navButton}>
                <PrimaryButton
                  label="< Back"
                  onPress={() => setStep(step - 1)}
                  disabled={loading}
                  tone="paper"
                />
              </View>
            )}

            <View style={styles.navButton}>
              {isLastStep ? (
                <PrimaryButton
                  label={loading ? "Saving..." : "Save"}
                  onPress={handleSave}
                  loading={loading}
                  disabled={loading}
                  icon={!loading ? <Check size={18} color="#fff" strokeWidth={3} /> : undefined}
                  // Navy face; the button draws its own hard shadow.
                  tone="navy"
                />
              ) : (
                <PrimaryButton
                  label="Next >"
                  onPress={() => setStep(step + 1)}
                  tone="navy"
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 30, // Bottom safe area, now that nothing is pinned below the scroll
  },
  introBlock: {
    gap: 6,
    marginBottom: 20,
  },
  stepEyebrow: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: INK,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: PIXEL,
    color: INK_MUTED,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    backgroundColor: '#CBD5E1', // Same slate as a disabled PrimaryButton face
  },
  progressSegmentDone: {
    backgroundColor: INK,
  },
  progressCount: {
    fontSize: 10,
    fontFamily: PIXEL_BOLD,
    color: INK,
    letterSpacing: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    // PrimaryButton's wrapper stretches to its parent, so each one gets a column
    // of its own and the pair splits the row evenly.
    flex: 1,
  },
});
