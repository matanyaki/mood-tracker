import { goalRepository } from '../repositories/goalRepository';
import { AppError, rethrow } from '../middleware/errorHandler';
import { computeEndDate } from '../../../shared/types';
import type { Goal, CreateGoalDTO, UpdateGoalDTO, GoalCompletion, GoalCompletionsByGoal } from '../../../shared/types';

export type { Goal, CreateGoalDTO, UpdateGoalDTO, GoalCompletion, GoalCompletionsByGoal };

class GoalService {
    /**
     * Create a new goal.
     *
     * endDate is derived here rather than taken from the request: it is a function
     * of startDate and months, and a client that sent its own could store a goal
     * whose end date disagrees with its own schedule.
     */
    async createGoal(userId: string, data: CreateGoalDTO): Promise<Goal> {
        try {
            const endDate = computeEndDate(data.startDate, data.months);
            return await goalRepository.create(userId, { ...data, endDate });
        } catch (error: unknown) {
            return rethrow(error, 'Failed to create goal');
        }
    }

    /**
     * Get all goals for a user.
     */
    async getGoals(userId: string): Promise<Goal[]> {
        try {
            return await goalRepository.findAll(userId);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch goals');
        }
    }

    /**
     * Every day marked done, as goalId -> dates. The Diary needs this for every goal
     * at once to decide what each scheduled day became, so it is one call rather
     * than one per goal.
     */
    async getAllCompletions(userId: string): Promise<GoalCompletionsByGoal> {
        try {
            return await goalRepository.findAllCompletions(userId);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch goal completions');
        }
    }

    /**
     * Get a single goal, or 404 if it isn't this user's.
     */
    async getGoal(userId: string, goalId: string): Promise<Goal> {
        try {
            const goal = await goalRepository.findById(userId, goalId);
            if (!goal) {
                throw new AppError('Goal not found.', 404);
            }
            return goal;
        } catch (error: unknown) {
            return rethrow(error, `Failed to fetch goal ${goalId}`);
        }
    }

    /**
     * Update an existing goal. endDate is recomputed, same as on create.
     */
    async updateGoal(userId: string, goalId: string, data: UpdateGoalDTO): Promise<void> {
        try {
            const endDate = computeEndDate(data.startDate, data.months);
            await goalRepository.update(userId, goalId, { ...data, endDate });
        } catch (error: unknown) {
            rethrow(error, `Failed to update goal ${goalId}`);
        }
    }

    /**
     * Delete a goal.
     */
    async deleteGoal(userId: string, goalId: string): Promise<void> {
        try {
            await goalRepository.delete(userId, goalId);
        } catch (error: unknown) {
            rethrow(error, `Failed to delete goal ${goalId}`);
        }
    }

    /**
     * Mark a goal done for one date.
     *
     * The goal is read first so a completion can never be written under an id the
     * user does not own — Firestore would happily create the subcollection beneath
     * a document that isn't there.
     */
    async markGoalDone(userId: string, goalId: string, date: string): Promise<GoalCompletion> {
        try {
            await this.getGoal(userId, goalId);
            return await goalRepository.markDone(userId, goalId, date);
        } catch (error: unknown) {
            return rethrow(error, `Failed to mark goal ${goalId} done`);
        }
    }
}

export default new GoalService();
