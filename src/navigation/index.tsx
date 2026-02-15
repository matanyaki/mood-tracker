// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Icons
import { Home, Book, BarChart2, User as UserIcon, Sun } from 'lucide-react-native';

// Screens
import CheckInScreen from '../screens/CheckInScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The "Inside" App (Bottom Tabs)
function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Today"
        // @ts-ignore - dynamic import or specific screen
        component={require('../screens/TodayScreen').default}
        options={{
          // Using Sun for Today
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size} />,
          tabBarLabel: 'Today'
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarLabel: 'Check In'
        }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
          tabBarLabel: 'Diary'
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
          tabBarLabel: 'Insights'
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}