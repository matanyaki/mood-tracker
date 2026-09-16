// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import type { Goal } from '@shared/types';

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
  Goals: undefined;   // The Goals list
  // No goal = create, a goal = edit. GoalForm handles both, because a goal is only
  // valid as a whole schedule.
  GoalForm: { goal?: Goal };
};