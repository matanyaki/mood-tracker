import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { MOOD_IMAGES } from '../constants/images';
import { useCheckInController } from '../controllers/useCheckInController';
import { ScreenContainer, AppHeader } from '../components';
import { getEmotionColor } from '../constants/colors';

// --- Constants ---
const SCREEN_WIDTH = Dimensions.get('window').width;

const EMOTIONS_CONFIG = [
  { id: 'happy', label: 'Happy', imageKey: 'happy' },
  { id: 'sad', label: 'Sad', imageKey: 'sad' },
  { id: 'worry', label: 'Worry', imageKey: 'bad' },
  { id: 'fear', label: 'Fear', imageKey: 'fearful' },
  { id: 'angry', label: 'Angry', imageKey: 'angry' },
];

const SCALE_POINTS = [1, 2, 3, 4, 5];

const getImageSource = (key: string) => {
  return MOOD_IMAGES[key];
};

// --- Internal Components ---

interface EmotionRowProps {
  id: string;
  label: string;
  imageKey: string;
  currentScale: number;
  onScaleChange: (val: number) => void;
}

const EmotionRow: React.FC<EmotionRowProps> = ({
  id, label, imageKey, currentScale, onScaleChange
}) => {
  const color = getEmotionColor(id);
  const isSelected = currentScale > 0;

  return (
    <View style={[
      styles.emotionRow,
      isSelected && { backgroundColor: '#FFFFFF', borderColor: color, borderWidth: 1 }
    ]}>
      {/* Left: Image & Label */}
      <View style={styles.emotionInfo}>
        <Image
          source={getImageSource(imageKey)}
          style={styles.emotionImage}
          resizeMode="contain"
        />
        <Text style={[
          styles.emotionLabel,
          isSelected && { color: color, fontWeight: '700' }
        ]}>
          {label}
        </Text>
      </View>

      {/* Right: Horizontal Scale */}
      <View style={styles.scaleContainer}>
        {SCALE_POINTS.map((point) => {
          const isActive = currentScale === point;
          return (
            <TouchableOpacity
              key={point}
              style={[
                styles.scaleButton,
                isActive && { backgroundColor: color, borderColor: color }
              ]}
              onPress={() => onScaleChange(isActive ? 0 : point)} // Toggle off if active
              activeOpacity={0.7}
            >
              <Text style={[
                styles.scaleText,
                isActive && { color: '#FFFFFF', fontWeight: 'bold' }
              ]}>
                {point}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const SubmitButton: React.FC<{ enabled: boolean; onPressed: () => void }> = ({ enabled, onPressed }) => (
  <View style={styles.footer}>
    <TouchableOpacity
      style={[styles.submitBtn, !enabled && styles.submitBtnDisabled]}
      onPress={onPressed}
      disabled={!enabled}
      activeOpacity={0.8}
    >
      <Text style={styles.submitBtnText}>
        {enabled ? 'Continue to Reflection' : 'Select at least one emotion'}
      </Text>
    </TouchableOpacity>
  </View>
);

// --- Main Component ---

export default function CheckInScreen({ navigation }: any) {
  const {
    updateScale,
    submitCheckIn,
    getScale,
    canSubmit
  } = useCheckInController();

  const handleComplete = () => {
    const data = submitCheckIn();
    if (data) {
      // Pass selections to Reflection Screen
      navigation.navigate('Reflection', { selections: data });
    }
  };

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
            onScaleChange={(val) => updateScale(emotion.id, emotion.label, val)}
          />
        ))}
      </ScrollView>

      <SubmitButton enabled={canSubmit} onPressed={handleComplete} />
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
  emotionRow: {
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emotionImage: {
    width: 40,
    height: 40,
  },
  emotionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scaleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  footer: {
    padding: 20,
    paddingBottom: 30, // Extra padding for bottom safe area if needed
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});