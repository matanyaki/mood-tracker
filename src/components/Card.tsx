import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
  elevation?: number;
}

/**
 * Reusable card component with platform-specific shadows.
 * Used for summary cards, stat rows, entry cards, etc.
 */
export default function Card({
  children,
  style,
  padding = 16,
  borderRadius = 20,
  elevation = 4,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          borderRadius,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
            },
            android: {
              elevation,
            },
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  },
});
