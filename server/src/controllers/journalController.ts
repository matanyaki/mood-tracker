import { Request, Response } from 'express';
import journalService, { JournalEntry } from '../services/journalService';
import { JournalEntrySchema } from '../../../shared/types';

const CreateEntryBodySchema = JournalEntrySchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true });
const UpdateEntryBodySchema = CreateEntryBodySchema.partial();

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

// Controller for Journal Entries
export const createEntry = async (req: Request, res: Response) => {
    try {

        const parsed = CreateEntryBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                data: null,
                error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            } as ApiResponse<null>);
        }

        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const entry = await journalService.createEntry(userId, parsed.data);

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
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No user ID found.'
            } as ApiResponse<null>);
        }

        const month = req.query.month as string | undefined;
        let entries: JournalEntry[];

        if (month) {
            console.log(`[Journal Controller] Fetching entries for month: ${month}`);
            entries = await journalService.getEntriesByMonth(userId, month);
        } else {
            console.log(`[Journal Controller] No month query parameter. Fetching default last 30 days.`);
            entries = await journalService.getEntries(userId, 30);
        }

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
        const userId = req.user?.uid;
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

        const parsed = UpdateEntryBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                data: null,
                error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            } as ApiResponse<null>);
        }

        await journalService.updateEntry(userId, id as string, parsed.data);

        return res.status(200).json({
            success: true,
            data: { id, ...parsed.data },
            error: null
        } as ApiResponse<any>);

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
        const userId = req.user?.uid;
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
