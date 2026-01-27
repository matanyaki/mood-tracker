import React from 'react';
import { StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { AppBackground, BackgroundVariant } from './AppBackground';

interface ScreenContainerProps {
  children: React.ReactNode;
  variant?: BackgroundVariant;
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * Reusable screen container that handles:
 * - Premium background system (AppBackground)
 * - StatusBar configuration
 * - Safe padding for status bar
 */
export default function ScreenContainer({
  children,
  variant = 'default',
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = 'transparent',
  style,
  animated = true,
}: ScreenContainerProps) {
  return (
    <AppBackground variant={variant} animated={animated} style={[styles.container, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent
      />
      {children}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
});
