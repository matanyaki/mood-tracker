import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface LoadingStateProps {
  color?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  fullScreen?: boolean;
}

/**
 * Reusable loading indicator component.
 * Used when fetching data across screens.
 */
export default function LoadingState({
  color = '#4F46E5',
  size = 'large',
  style,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.container,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
