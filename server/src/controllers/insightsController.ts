import { Request, Response } from 'express';
import { z } from 'zod';
import journalService, { JournalEntry } from '../services/journalService';
import insightsService from '../services/insightsService';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

// A bare parseInt turns `?days=abc` into NaN, which is falsy, which silently means
// "no time filter" — i.e. read the user's entire history. Coerce and bound it.
const DaysQuerySchema = z.coerce.number().int().positive().max(365).default(30);

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const getInsightsData = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const days = DaysQuerySchema.parse(req.query.days);

    const entries = await journalService.getEntries(userId, days);

    return res.status(200).json({
        success: true,
        data: entries,
        error: null
    } as ApiResponse<JournalEntry[]>);
});

export const getEmotionStats = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const days = DaysQuerySchema.parse(req.query.days);

    const counts = await insightsService.getEmotionCounts(userId, days);

    return res.status(200).json({
        success: true,
        data: counts,
        error: null
    } as ApiResponse<Record<string, number>>);
});
