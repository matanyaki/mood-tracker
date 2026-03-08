import { Request, Response } from 'express';
import journalService, { JournalEntry } from '../services/journalService';

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

// Controller for Journal Entries
export const createEntry = async (req: Request, res: Response) => {
    try {

        const { date, timestamp, emotions, aiFeedback } = req.body;
        // Basic validation
        if (!date || !timestamp || !emotions || !Array.isArray(emotions)) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Missing required fields: date, timestamp, emotions(array).'
            } as ApiResponse<null>);
        }

        // Simulating userId from middleware (which may extract it from token or header)
        const userId = (req as any).user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const entry = await journalService.createEntry(userId, { date, timestamp, emotions, aiFeedback });

        return res.status(201).json({
            success: true,
            data: entry,
            error: null
        } as ApiResponse<JournalEntry>);

    } catch (error: any) {
        console.error('Error creating journal entry:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Internal Server Error'
        } as ApiResponse<null>);
    }
};

export const getEntries = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const entries = await journalService.getEntries(userId);

        return res.status(200).json({
            success: true,
            data: entries,
            error: null
        } as ApiResponse<JournalEntry[]>);

    } catch (error: any) {
        console.error('Error getting journal entries:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Internal Server Error'
        } as ApiResponse<null>);
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Entry ID is required.'
            } as ApiResponse<null>);
        }

        await journalService.updateEntry(userId, id as string, updates);

        return res.status(200).json({
            success: true,
            data: { id, ...updates }, // Return updated/merged object logically, or null
            error: null
        } as ApiResponse<any>); // Could refetch if strict consistency needed

    } catch (error: any) {
        console.error('Error updating journal entry:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Internal Server Error'
        } as ApiResponse<null>);
    }
};

export const deleteEntry = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Entry ID is required.'
            } as ApiResponse<null>);
        }

        await journalService.deleteEntry(userId, id as string);

        return res.status(200).json({
            success: true,
            data: { id, deleted: true },
            error: null
        } as ApiResponse<any>);

    } catch (error: any) {
        console.error('Error deleting journal entry:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Internal Server Error'
        } as ApiResponse<null>);
    }
};
