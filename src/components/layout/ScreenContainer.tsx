import React from 'react';
import { StatusBar, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground, { BackgroundVariant } from './AppBackground';

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
 * - Safe padding for the status bar / notch
 *
 * The top padding is the safe-area inset, not `StatusBar.currentHeight`: that one
 * only exists on Android, so on iOS it was 0 and every header sat under the notch.
 * On Android the inset is the same status-bar height, so nothing moves there.
 *
 * The bottom is NOT padded here. Tab screens end at the tab bar, which handles its
 * own inset; stack screens add `insets.bottom` to whatever is last on them (a
 * pinned footer, or the scroll's bottom padding), so their background still runs
 * to the edge.
 */
export default function ScreenContainer({
  children,
  variant = 'default',
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = 'transparent',
  style,
  animated = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppBackground
      variant={variant}
      animated={animated}
      style={[{ flex: 1, paddingTop: insets.top }, style]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent
      />
      {children}
    </AppBackground>
  );
}
