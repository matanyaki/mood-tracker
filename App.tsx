// App.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import RootNavigator from './src/navigation/index';
import { AuthProvider } from './src/context/AuthContext';
import { PixelAlertHost } from './src/components/ui/PixelAlert';
import { PIXEL_FONTS } from './src/constants/typography';
import { GC_TIME_MS, CACHE_BUSTER } from './src/hooks/queryConfig';

const queryClient = new QueryClient();

// The query cache is written to the device, so a cold start paints the last known
// streak and quote at once and refetches behind them instead of starting empty.
// maxAge matches GC_TIME_MS: a query collected from memory is also dropped from the
// persisted copy, so a shorter gcTime would quietly defeat this.
const persister = createAsyncStoragePersister({ storage: AsyncStorage });

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
    // Outermost on purpose: Gesture Handler has to own the touch pipeline above
    // everything that uses it -- currently the FabMenu rows.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: GC_TIME_MS, buster: CACHE_BUSTER }}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PersistQueryClientProvider>
        {/* Every PixelAlert.alert in the app is drawn by this one host. */}
        <PixelAlertHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
