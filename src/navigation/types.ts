// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// 1. The "Tab" Navigator (The main app)
export type AppTabsParamList = {
  CheckIn: undefined; // The 'Check In' tab
  Diary: undefined;   // The 'Diary' tab
  Insights: undefined; // The 'Insights' tab
};

// 2. The "Root" Navigator (Switches between Auth and App)
export type RootStackParamList = {
  Auth: undefined;    // The Login Screen
  App: NavigatorScreenParams<AppTabsParamList>; // The Main App (Tabs)
};