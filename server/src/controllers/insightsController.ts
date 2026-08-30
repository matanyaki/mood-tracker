import { Request, Response } from 'express';
import { z } from 'zod';
import journalService, { JournalEntry } from '../services/journalService';
import insightsService from '../services/insightsService';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

// A bare parseInt turns `?days=abc` into NaN, which is falsy, which silently means
// "no time filter" — i.e. read the user's entire history. Coerce and bound it.
const DaysQuerySchema = z.coerce.number().int().positive().max(365).default(30);

// The stats window is either an absolute month (what the Insights screen filters by)
// or the rolling `days` fallback. Validated here so a malformed month can never reach
// the Firestore range query.
const MonthQuerySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional();

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
    const month = MonthQuerySchema.parse(req.query.month);
    // `days` defaults to 30, so it must not be read at all when a month is given —
    // otherwise the rolling window would silently narrow the requested month.
    const days = month ? undefined : DaysQuerySchema.parse(req.query.days);

    const counts = await insightsService.getEmotionCounts(userId, days, month);

    return res.status(200).json({
        success: true,
        data: counts,
        error: null
    } as ApiResponse<Record<string, number>>);
});
