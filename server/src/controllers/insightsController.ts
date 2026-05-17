import { Request, Response } from 'express';
import journalService, { JournalEntry } from '../services/journalService';

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const getInsightsData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
        const entries = await journalService.getEntries(userId, days);

        return res.status(200).json({
            success: true,
            data: entries,
            error: null
        } as ApiResponse<JournalEntry[]>);

    } catch (error: any) {
        console.error('Error getting insights data:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Internal Server Error'
        } as ApiResponse<null>);
    }
};
