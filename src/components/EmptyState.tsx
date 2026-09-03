import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

/**
 * Reusable empty state component.
 * Used when there's no data to display (e.g., no entries, no stats).
 */
export default function EmptyState({
  emoji,
  title,
  subtitle,
  buttonLabel,
  onButtonPress,
  style,
  titleStyle,
  subtitleStyle,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
      )}
      {buttonLabel && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: PIXEL_BOLD,
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: PIXEL,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: PIXEL_BOLD,
    color: '#fff',
  },
});
