import { Request, Response } from 'express';
import { z } from 'zod';
import goalService from '../services/goalService';
import {
    Goal, GoalCompletion, GoalCompletionsByGoal, GoalProgress, GoalSchema, GoalDateSchema,
} from '../../../shared/types';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

/**
 * Derived from the canonical schema, so the shared contract stays the single source
 * of truth — and so a client structurally cannot set its own userId or endDate.
 *
 * The refine is the one rule that no single field can carry: picking three days a
 * week means picking exactly three weekday boxes, and a goal that disagrees with
 * itself would schedule nothing the user asked for.
 */
const GoalBodySchema = GoalSchema
    .omit({ id: true, userId: true, endDate: true, createdAt: true, updatedAt: true })
    .extend({ startDate: GoalDateSchema })
    .refine(data => data.daysOfWeek.length === data.timesPerWeek, {
        message: 'Pick exactly one weekday for each time per week.',
        path: ['daysOfWeek'],
    });

// Update takes the same full body rather than a partial one. A goal's schedule is
// only valid as a whole — a patch that moved timesPerWeek without daysOfWeek would
// pass field-by-field and still break the rule above.
const UpdateGoalBodySchema = GoalBodySchema;

const MarkDoneBodySchema = z.object({
    date: GoalDateSchema,
});

// The caller's `getTimezoneOffset()`, bounded and defaulted exactly as GET /api/streaks
// takes it (see streakController) — "today" is a question about the user's calendar.
const TzOffsetQuerySchema = z.coerce.number().int().min(-840).max(720).default(0);

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const createGoal = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const data = GoalBodySchema.parse(req.body);

    const goal = await goalService.createGoal(userId, data);

    return res.status(201).json({
        success: true,
        data: goal,
        error: null
    } as ApiResponse<Goal>);
});

export const getGoals = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);

    const goals = await goalService.getGoals(userId);

    return res.status(200).json({
        success: true,
        data: goals,
        error: null
    } as ApiResponse<Goal[]>);
});

/**
 * Every day the user has marked done, keyed by goal.
 *
 * Whole-list rather than per-goal because the Diary decides the status of every
 * scheduled day on screen at once, and asking per goal would be one request per
 * goal for a screen that already knows it wants all of them.
 */
export const getCompletions = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);

    const completions = await goalService.getAllCompletions(userId);

    return res.status(200).json({
        success: true,
        data: completions,
        error: null
    } as ApiResponse<GoalCompletionsByGoal>);
});

/**
 * Every goal's completed / target / percent over its full run, start to end date.
 */
export const getGoalProgress = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const tzOffsetMinutes = TzOffsetQuerySchema.parse(req.query.tzOffsetMinutes);

    const progress = await goalService.getGoalProgress(userId, tzOffsetMinutes);

    return res.status(200).json({
        success: true,
        data: progress,
        error: null
    } as ApiResponse<GoalProgress[]>);
});

export const getGoal = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;

    const goal = await goalService.getGoal(userId, id as string);

    return res.status(200).json({
        success: true,
        data: goal,
        error: null
    } as ApiResponse<Goal>);
});

export const updateGoal = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;
    const data = UpdateGoalBodySchema.parse(req.body);

    await goalService.updateGoal(userId, id as string, data);

    return res.status(200).json({
        success: true,
        data: { id, ...data },
        error: null
    } as ApiResponse<unknown>);
});

export const deleteGoal = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;

    await goalService.deleteGoal(userId, id as string);

    return res.status(200).json({
        success: true,
        data: { id, deleted: true },
        error: null
    } as ApiResponse<unknown>);
});

export const markGoalDone = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;
    const { date } = MarkDoneBodySchema.parse(req.body);

    const completion = await goalService.markGoalDone(userId, id as string, date);

    return res.status(201).json({
        success: true,
        data: completion,
        error: null
    } as ApiResponse<GoalCompletion>);
});
