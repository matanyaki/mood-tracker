// src/services/goalService.ts
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { auth } from '../config/firebase';
import { GUEST_ID, GUEST_GOALS_KEY, GUEST_GOAL_COMPLETIONS_KEY } from '../constants/variables';
import type {
    Goal, CreateGoalDTO, UpdateGoalDTO, GoalCompletion, GoalCompletionsByGoal, GoalProgress,
} from '@shared/types';
import { GoalSchema, GoalCompletionSchema, GoalProgressSchema, computeEndDate } from '../../shared/types';
import { dayKeyFromMillis } from '../../shared/utils/streak';
import { computeGoalProgress } from '../../shared/utils/goalProgress';

export type { Goal, CreateGoalDTO, UpdateGoalDTO, GoalCompletion, GoalCompletionsByGoal, GoalProgress };

/**
 * Which days a guest has marked done, as goalId -> ['YYYY-MM-DD', ...].
 *
 * The backend gives a completion its own document named after the date, so the
 * document's existence is the fact. There are no documents on the device, so
 * membership in this list plays the same part — and, like the documents, an entry
 * is only ever added, never edited or removed.
 */
type GuestCompletions = Record<string, string[]>;

const readGuestGoals = async (): Promise<Goal[]> => {
    const json = await AsyncStorage.getItem(GUEST_GOALS_KEY);
    return json ? JSON.parse(json) : [];
};

const writeGuestGoals = (goals: Goal[]) =>
    AsyncStorage.setItem(GUEST_GOALS_KEY, JSON.stringify(goals));

export const GoalService = {

    // Helper to check if we should use local storage
    isGuest: (userId: string) => !userId || userId === GUEST_ID,

    /**
     * Create a goal.
     * - Authenticated: Saves via Custom Backend API
     * - Guest: Saves to AsyncStorage
     *
     * endDate is not sent: the server derives it from startDate + months. The guest
     * branch calls the same shared helper, so a guest who signs up later does not
     * see their goals' end dates shift.
     */
    createGoal: async (userId: string, data: CreateGoalDTO): Promise<Goal> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE (Guest) ---
                const existing = await readGuestGoals();

                const newGoal: Goal = {
                    ...data,
                    id: Date.now().toString(),
                    userId: GUEST_ID,
                    endDate: computeEndDate(data.startDate, data.months),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                await writeGuestGoals([newGoal, ...existing]);
                return newGoal;

            } else {
                // --- API (Authenticated) ---
                console.log(`[GoalService] Creating goal for user via API`);
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                const created = await api.post('/api/goals', data);
                return GoalSchema.parse(created);
            }
        } catch (error) {
            console.error("Error [createGoal]:", error);
            throw error;
        }
    },

    /**
     * Get all goals for a user.
     */
    getUserGoals: async (userId: string): Promise<Goal[]> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const goals = await readGuestGoals();
                return goals.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Fetching goals for userId: ${userId}`);
                const result = await api.get('/api/goals');
                return z.array(GoalSchema).parse(result);
            }
        } catch (error) {
            console.error("Error [getUserGoals]:", error);
            throw error;
        }
    },

    /**
     * Every day marked done, as goalId -> ['YYYY-MM-DD', ...].
     *
     * What the Diary reads to tell a day that was kept from one that was missed. The
     * guest branch already stores exactly this shape, so the two sides answer the
     * same way — the only difference is that the stored object may still hold ids of
     * goals that have since been deleted, which the caller looks up by goal and so
     * never sees.
     */
    getAllCompletions: async (userId: string): Promise<GoalCompletionsByGoal> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const json = await AsyncStorage.getItem(GUEST_GOAL_COMPLETIONS_KEY);
                return json ? JSON.parse(json) : {};

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Fetching goal completions for userId: ${userId}`);
                const result = await api.get('/api/goals/completions');
                return z.record(z.string(), z.array(z.string())).parse(result);
            }
        } catch (error) {
            console.error("Error [getAllCompletions]:", error);
            throw error;
        }
    },

    /**
     * Every goal's completed / target / percent over its full run, start to end date.
     * - Authenticated: GET /api/goals/progress — the server counts, the client displays.
     * - Guest: counted locally with the same shared function, because guest data
     *   never reaches the backend at all.
     *
     * The device's UTC offset goes with the request, as it does for streaks: the
     * server decides which day is today, but only the device knows its timezone.
     */
    getGoalProgress: async (userId: string): Promise<GoalProgress[]> => {
        const tzOffsetMinutes = new Date().getTimezoneOffset();

        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const [goals, completions] = await Promise.all([
                    GoalService.getUserGoals(userId),
                    GoalService.getAllCompletions(userId),
                ]);
                return computeGoalProgress(goals, completions, dayKeyFromMillis(Date.now(), tzOffsetMinutes));

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Fetching goal progress (tzOffsetMinutes: ${tzOffsetMinutes})`);
                const result = await api.get('/api/goals/progress', { params: { tzOffsetMinutes } });
                return z.array(GoalProgressSchema).parse(result);
            }
        } catch (error) {
            console.error("Error [getGoalProgress]:", error);
            throw error;
        }
    },

    /**
     * Get a single goal.
     */
    getGoal: async (userId: string, goalId: string): Promise<Goal> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const goals = await readGuestGoals();
                const goal = goals.find(g => g.id === goalId);
                if (!goal) throw new Error("Goal not found.");
                return goal;

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Fetching goal ${goalId}`);
                const result = await api.get(`/api/goals/${goalId}`);
                return GoalSchema.parse(result);
            }
        } catch (error) {
            console.error("Error [getGoal]:", error);
            throw error;
        }
    },

    /**
     * Update a goal. The whole editable body goes up, not a patch — a schedule is
     * only valid as a whole, which is the same reason the server takes a full body.
     */
    updateGoal: async (userId: string, goalId: string, data: UpdateGoalDTO): Promise<void> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const goals = await readGuestGoals();
                await writeGuestGoals(goals.map(goal =>
                    goal.id === goalId
                        ? {
                            ...goal,
                            ...data,
                            endDate: computeEndDate(data.startDate, data.months),
                            updatedAt: new Date().toISOString(),
                        }
                        : goal
                ));

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Updating goal ${goalId}`);
                await api.put(`/api/goals/${goalId}`, data);
            }
        } catch (error) {
            console.error("Error [updateGoal]:", error);
            throw error;
        }
    },

    /**
     * Delete a goal, and with it the days marked done against it.
     */
    deleteGoal: async (userId: string, goalId: string): Promise<void> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const goals = await readGuestGoals();
                await writeGuestGoals(goals.filter(goal => goal.id !== goalId));

                // Same reason the server deletes the completions subcollection: a
                // leftover list would be inherited by whatever reuses the id.
                const json = await AsyncStorage.getItem(GUEST_GOAL_COMPLETIONS_KEY);
                const completions: GuestCompletions = json ? JSON.parse(json) : {};
                delete completions[goalId];
                await AsyncStorage.setItem(GUEST_GOAL_COMPLETIONS_KEY, JSON.stringify(completions));

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Deleting goal ${goalId}`);
                await api.delete(`/api/goals/${goalId}`);
            }
        } catch (error) {
            console.error("Error [deleteGoal]:", error);
            throw error;
        }
    },

    /**
     * Mark a goal done for one date ('YYYY-MM-DD').
     *
     * Marking the same day twice is a no-op on both sides — the date names the
     * record, so there is nothing to duplicate and nothing to undo.
     */
    markGoalDone: async (userId: string, goalId: string, date: string): Promise<GoalCompletion> => {
        try {
            if (GoalService.isGuest(userId)) {
                // --- LOCAL STORAGE ---
                const json = await AsyncStorage.getItem(GUEST_GOAL_COMPLETIONS_KEY);
                const completions: GuestCompletions = json ? JSON.parse(json) : {};
                const dates = completions[goalId] ?? [];

                if (!dates.includes(date)) {
                    completions[goalId] = [...dates, date];
                    await AsyncStorage.setItem(GUEST_GOAL_COMPLETIONS_KEY, JSON.stringify(completions));
                }

                return { id: date, done: true, completedAt: new Date().toISOString() };

            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GoalService] Marking goal ${goalId} done for ${date}`);
                const created = await api.post(`/api/goals/${goalId}/completions`, { date });
                return GoalCompletionSchema.parse(created);
            }
        } catch (error) {
            console.error("Error [markGoalDone]:", error);
            throw error;
        }
    },
};
