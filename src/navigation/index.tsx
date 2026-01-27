// src/navigation/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase'; // Your firebase config
import { ActivityIndicator, View } from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import { User as UserIcon } from 'lucide-react-native';
// Icons
import { Home, Book, BarChart2 } from 'lucide-react-native';

// Screens
import CheckInScreen from '../screens/CheckInScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InsightsScreen from '../screens/InsightsScreen';

// Placeholder Screens (We will build these next!)
import { Text } from 'react-native';

// ---------------------------------------------------------

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The "Inside" App (Bottom Tabs)
function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener fires whenever the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
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