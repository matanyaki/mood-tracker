import { Request, Response } from 'express';
import userService from '../services/userService';
import { UserProfile } from '../../../shared/types';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const syncUser = asyncWrap(async (req: Request, res: Response) => {
    // Never trust req.body for identity — a caller could sync a profile under any
    // uid/email. Build it from the token verified by authenticateUser. The body is
    // ignored entirely, which is why there is no schema to parse here.
    const uid = requireUid(req);

    // Firebase permits emailless accounts; the repository stores '' in that case.
    await userService.syncUser({ uid, email: req.user?.email ?? '' });

    return res.status(200).json({
        success: true,
        data: null,
        error: null
    } as ApiResponse<null>);
});

export const incrementEntryCount = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);

    await userService.incrementEntryCount(userId);

    return res.status(200).json({
        success: true,
        data: null,
        error: null
    } as ApiResponse<null>);
});

export const getProfile = asyncWrap(async (req: Request, res: Response) => {
    // Ignore any client-supplied user id entirely (IDOR). Always use the uid
    // verified by the auth middleware.
    const userId = requireUid(req);

    const profile = await userService.getProfile(userId);

    return res.status(200).json({
        success: true,
        data: profile,
        error: null
    } as ApiResponse<UserProfile | null>);
});
