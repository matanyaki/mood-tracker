import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TYPE } from '../../constants/typography';
import { SCREEN_GUTTER, SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, PRESSED, PRESS_SINK, BORDER_W_INNER } from '../../constants/pixel';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  /** Usually a <BackButton />. */
  leftAction?: React.ReactNode;
}

/**
 * The header every screen opens with: one h1 title, an optional caption under it,
 * a back button on the left and a small action on the right.
 *
 * The pixel treatment lives here, not on the screens. It used to be passed in as
 * overrides by nine screens while the tenth (Today) passed none and drew at a
 * different size -- so the style is no longer overridable at all.
 */
export default function AppHeader({
  title,
  subtitle,
  rightAction,
  leftAction,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {leftAction && (
        <View style={styles.leftActionContainer}>
          {leftAction}
        </View>
      )}

      <View style={styles.headerContent}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
          )}
        </View>
      </View>

      {rightAction && (
        <Pressable
          onPress={rightAction.onPress}
          // The face is a small tag beside the title; the slop takes it to 44.
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={rightAction.label}
          style={({ pressed }) => [styles.rightAction, pressed && styles.rightActionPressed]}
        >
          <Text style={styles.rightActionText}>{rightAction.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingVertical: SPACE.md,
    flexDirection: 'row',
    // Centred, so a 36px back button and a one- or two-line title share a midline.
    alignItems: 'center',
    gap: SPACE.md,
  },
  leftActionContainer: {
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...TYPE.h1,
  },
  subtitle: {
    ...TYPE.caption,
  },
  rightAction: {
    flexShrink: 0,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
  },
  rightActionPressed: {
    transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
    backgroundColor: PRESSED,
  },
  rightActionText: {
    ...TYPE.label,
  },
});
