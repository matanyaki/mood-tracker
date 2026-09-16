import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GoalService } from '../services/goalService';
import { GUEST_ID } from '../constants/variables';
import { useAuth } from '../context/AuthContext';
import type { CreateGoalDTO, UpdateGoalDTO } from '@shared/types';

/**
 * Writes for the Goals flow. Reads come from useGoalsQuery.
 *
 * Every write invalidates ['goals'], which is the list the Goals screen renders —
 * the same arrangement the greeting flow uses, where the controller owns the save
 * and the query owns the fetch.
 */
export const useGoalsController = () => {
    const { user, isGuest } = useAuth();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resolved the same way the greeting flow resolves it: guests get GUEST_ID,
    // which GoalService branches on internally.
    const userId = isGuest || !user ? GUEST_ID : user.uid;

    const createGoal = useCallback(async (data: CreateGoalDTO) => {
        setIsSaving(true);
        setError(null);
        try {
            console.log(`[GoalsController] Creating goal for UserID: ${userId} (Guest Mode: ${isGuest})`);
            const goal = await GoalService.createGoal(userId, data);
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            return goal;
        } catch (err: any) {
            console.error("Failed to create goal:", err);
            setError(err.message || "Could not save your goal.");
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [userId, isGuest, queryClient]);

    const updateGoal = useCallback(async (goalId: string, data: UpdateGoalDTO) => {
        setIsSaving(true);
        setError(null);
        try {
            console.log(`[GoalsController] Updating goal ${goalId}`);
            await GoalService.updateGoal(userId, goalId, data);
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        } catch (err: any) {
            console.error("Failed to update goal:", err);
            setError(err.message || "Could not save your goal.");
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [userId, queryClient]);

    const deleteGoal = useCallback(async (goalId: string) => {
        setIsSaving(true);
        setError(null);
        try {
            console.log(`[GoalsController] Deleting goal ${goalId}`);
            await GoalService.deleteGoal(userId, goalId);
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            // Deleting takes the goal's completions with it, so the cached map
            // still holds days marked against an id that no longer exists.
            queryClient.invalidateQueries({ queryKey: ['goalCompletions'] });
        } catch (err: any) {
            console.error("Failed to delete goal:", err);
            setError(err.message || "Could not delete your goal.");
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [userId, queryClient]);

    const markGoalDone = useCallback(async (goalId: string, date: string) => {
        try {
            console.log(`[GoalsController] Marking goal ${goalId} done for ${date}`);
            const completion = await GoalService.markGoalDone(userId, goalId, date);
            // The Diary reads this map to tell a day that was kept from one that was
            // missed, so a day marked done has to reach it without waiting out staleTime.
            queryClient.invalidateQueries({ queryKey: ['goalCompletions'] });
            return completion;
        } catch (err: any) {
            console.error("Failed to mark goal done:", err);
            setError(err.message || "Could not mark your goal done.");
            throw err;
        }
    }, [userId, queryClient]);

    return {
        createGoal,
        updateGoal,
        deleteGoal,
        markGoalDone,
        isSaving,
        error
    };
};
