// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePrefetchInsights } from '../controllers/useInsightsController';
import { TYPE, TIGHT_FONT_SCALE } from '../constants/typography';
import { INK_MUTED } from '../constants/pixel';

// Screens
import CheckInScreen from '../screens/CheckInScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GoalsScreen from '../screens/GoalsScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import TipsScreen from '../screens/TipsScreen';
import BreatheScreen from '../screens/BreatheScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Pixel-art palette: flat black outline + hard offset shadow (no blur, no radius) -- matches FabMenu
const BORDER = '#000000';
// Inactive tabs. Was #9CA3AF, 2.5:1 on the white bar; the label needs 4.5:1.
const MUTED = INK_MUTED;

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

// The tab label. A function rather than a style so it can cap font scaling: four
// labels share a phone's width, and at a large system font "INSIGHTS" would wrap.
function PixelTabLabel({ color, children }: { color: string; children: string }) {
  return (
    <Text style={[tabStyles.tabBarLabel, { color }]} numberOfLines={1} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
      {children}
    </Text>
  );
}

// The "Inside" App (Bottom Tabs)
function AppTabs() {
  // A fixed tabBarStyle height overrides react-navigation's own safe-area handling,
  // so the bar was sitting too low / crowding the home indicator -- add the inset back in ourselves.
  const insets = useSafeAreaInsets();

  // Insights is a tab away from wherever the app opens; have its data ready by then.
  usePrefetchInsights();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BORDER,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: [tabStyles.tabBar, { height: 58 + insets.bottom, paddingBottom: insets.bottom + 6 }],
        tabBarLabel: ({ color, children }) => <PixelTabLabel color={color}>{children}</PixelTabLabel>,
        tabBarItemStyle: tabStyles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Today"
        // @ts-ignore - dynamic import or specific screen
        component={require('../screens/TodayScreen').default}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="wb-sunny" focused={focused} />,
          title: 'Today',
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
          title: 'Diary',
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="insights" focused={focused} />,
          title: 'Insights',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon name="account-circle" focused={focused} />,
          title: 'Profile',
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
    ...TYPE.label,
    letterSpacing: 0.5,
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
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="GoalForm" component={GoalFormScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Tips" component={TipsScreen} />
        <Stack.Screen name="Breathe" component={BreatheScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
// Trigger reload for NavigationTree rebuild
