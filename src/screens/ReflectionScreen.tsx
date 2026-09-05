import React from 'react';
import {
  View, Text, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { ScreenContainer, AppHeader, ReflectionCard, PrimaryButton } from '../components';
import { useReflectionController } from '../controllers/useReflectionController';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

export default function ReflectionScreen({ route, navigation }: any) {
  const {
    selections,
    notes,
    loading,
    handleTextChange,
    handleSave
  } = useReflectionController(route, navigation);

  return (
    <ScreenContainer variant="focus">
      {/* AppHeader is shared with four other screens, so the pixel treatment is
          passed in here rather than baked into the component. */}
      <AppHeader
        title="Reflect"
        titleStyle={styles.headerTitle}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introBlock}>
            {/* Reflection is only ever reached from Check In's Continue button. */}
            <Text style={styles.stepEyebrow}>[ STEP 2 OF 2 ]</Text>
            <Text style={styles.subtitle}>Take a moment to write about your feelings.</Text>
          </View>

          {/* Loop through selections */}
          {selections.map((item: any, index: number) => {
            const isLast = index === selections.length - 1;

            return (
              <ReflectionCard
                key={item.id}
                label={item.label}
                rootEmotionId={item.id}
                note={notes[item.id] || ''}
                onChangeText={handleTextChange}
                isLast={isLast}
              />
            );
          })}

          {/* Main Save Button */}
          <View style={styles.footerContainer}>
            <PrimaryButton
              label={loading ? "Saving..." : "Save Entry"}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              icon={!loading ? <Check size={18} color="#fff" strokeWidth={3} /> : undefined}
              // Navy face; the button draws its own hard shadow, so the blurred
              // `shadowColor` this used to pass has nothing left to colour.
              style={{ backgroundColor: INK }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
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
  scrollContent: {
    padding: 20,
    paddingTop: 10,
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
  footerContainer: {
    marginTop: 10,
    marginBottom: 20,
  }
});
