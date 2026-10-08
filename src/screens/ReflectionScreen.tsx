import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, ReflectionCard, PrimaryButton } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';
import { getEmotionColor } from '../constants/colors';
import { TYPE } from '../constants/typography';
import { CARD_GAP, SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SPACE } from '../constants/layout';
import { INK } from '../constants/pixel';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave
  } = useReflectionController(route, navigation);
  const insets = useSafeAreaInsets();

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
          // Runs to the bottom edge with nothing pinned under it, so the last
          // button clears the home indicator itself.
          contentContainerStyle={[styles.scrollContent, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
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
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: SCREEN_TOP,
    gap: CARD_GAP,
  },
  introBlock: {
    gap: SPACE.xs,
  },
  stepEyebrow: {
    ...TYPE.label,
    letterSpacing: 2,
  },
  subtitle: {
    ...TYPE.body,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACE.xs,
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
    ...TYPE.label,
  },
  navRow: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  navButton: {
    // PrimaryButton's wrapper stretches to its parent, so each one gets a column
    // of its own and the pair splits the row evenly.
    flex: 1,
  },
});
