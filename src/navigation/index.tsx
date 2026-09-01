// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import CheckInScreen from '../screens/CheckInScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Pixel-art palette: flat black outline + hard offset shadow (no blur, no radius) -- matches FabMenu
const BORDER = '#000000';
const MUTED = '#9CA3AF';
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// MaterialIcons tab icon rendered as a pixel box: plain icon when idle, boxed + offset
// shadow when focused (reads as a "pressed" pixel button, same language as FabMenu).
function PixelTabIcon({ name, focused }: { name: React.ComponentProps<typeof MaterialIcons>['name']; focused: boolean }) {
  const color = focused ? BORDER : MUTED;
  return (
    <View style={tabStyles.iconWrapper}>
      {focused && <View style={tabStyles.iconShadow} pointerEvents="none" />}
      <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxFocused]}>
        <MaterialIcons name={name} size={20} color={color} />
      </View>
    </View>
  );
}

// The "Inside" App (Bottom Tabs)
function AppTabs() {
  // A fixed tabBarStyle height overrides react-navigation's own safe-area handling,
  // so the bar was sitting too low / crowding the home indicator -- add the inset back in ourselves.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BORDER,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: [tabStyles.tabBar, { height: 54 + insets.bottom, paddingBottom: insets.bottom + 6 }],
        tabBarLabelStyle: tabStyles.tabBarLabel,
        tabBarItemStyle: tabStyles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Today"
        // @ts-ignore - dynamic import or specific screen
        component={require('../screens/TodayScreen').default}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="wb-sunny" focused={focused} />,
          tabBarLabel: 'Today'
        }}
      />
      {/* <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="home" focused={focused} />,
          tabBarLabel: 'Check In'
        }}
      /> */}
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="calendar-today" focused={focused} />,
          tabBarLabel: 'Diary'
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="insights" focused={focused} />,
          tabBarLabel: 'Insights'
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="account-circle" focused={focused} />,
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: BORDER,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontFamily: MONO,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShadow: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: BORDER,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxFocused: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: BORDER,
  },
});

export default function RootNavigator() {
  const { isLoading } = useAuth();

  // Debug Log for loading state
  useEffect(() => {
    console.log("[RootNavigator] Loading state:", isLoading);
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="App"
      >
        <Stack.Screen name="App" component={AppTabs} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
// Trigger reload for NavigationTree rebuild
