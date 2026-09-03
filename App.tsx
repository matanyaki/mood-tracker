// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import RootNavigator from './src/navigation/index';
import { AuthProvider } from './src/context/AuthContext';
import { PIXEL_FONTS } from './src/constants/typography';

const queryClient = new QueryClient();

export default function App() {
  // Every screen styles its text with the Silkscreen family, and Android renders
  // text in a not-yet-loaded family as blank, so hold the first frame until the
  // faces are registered. On a load error we render anyway rather than trapping
  // the user on an empty screen -- the system fallback face is ugly but usable.
  const [fontsLoaded, fontError] = useFonts(PIXEL_FONTS);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
