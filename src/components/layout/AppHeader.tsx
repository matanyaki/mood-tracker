import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  rightAction?: {
    label: string;
    onPress: () => void;
    style?: ViewStyle;
    /** Optional, so a screen can restyle the label without touching the others. */
    textStyle?: TextStyle;
  };
  leftAction?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

/**
 * Reusable header component used across screens.
 * Supports:
 * - Title + subtitle (most common)
 * - Optional emoji icon
 * - Optional right action button
 * - Optional left action (e.g., back button)
 */
export default function AppHeader({
  title,
  subtitle,
  emoji,
  rightAction,
  leftAction,
  style,
  titleStyle,
  subtitleStyle,
}: AppHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {leftAction && (
        <View style={styles.leftActionContainer}>
          {leftAction}
        </View>
      )}

      <View style={styles.headerContent}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <View style={styles.textContainer}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      </View>

      {rightAction ? (
        <TouchableOpacity
          style={[styles.rightAction, rightAction.style]}
          onPress={rightAction.onPress}
        >
          <Text style={[styles.rightActionText, rightAction.textStyle]}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftActionContainer: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: PIXEL_BOLD,
    color: '#1A1A2E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: PIXEL,
    color: '#4A4A4A',
  },
  rightAction: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rightActionText: {
    fontSize: 14,
    fontFamily: PIXEL_BOLD,
    color: '#4F46E5',
  },
  rightSpacer: {
    width: 0,
  },
});
