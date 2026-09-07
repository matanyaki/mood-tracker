import { Request, Response } from 'express';
import { z } from 'zod';
import streakService from '../services/streakService';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';
import type { StreakSummary } from '../../../shared/types';

/**
 * The caller's UTC offset, exactly as `Date.prototype.getTimezoneOffset()` reports
 * it: minutes BEHIND UTC, so UTC+3 sends -180 and UTC-5 sends 300.
 *
 * The server cannot infer this — its own timezone is not the user's — so the client
 * states it. Bounded to the real range of world offsets (UTC+14 .. UTC-12) so a junk
 * value cannot shift every day key by an arbitrary amount. Defaults to 0 rather than
 * rejecting: a missing offset should still answer, just in UTC.
 */
const TzOffsetQuerySchema = z.coerce.number().int().min(-840).max(720).default(0);

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const getStreaks = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const tzOffsetMinutes = TzOffsetQuerySchema.parse(req.query.tzOffsetMinutes);

    const summary = await streakService.getStreakSummary(userId, tzOffsetMinutes);

    return res.status(200).json({
        success: true,
        data: summary,
        error: null
    } as ApiResponse<StreakSummary>);
});
