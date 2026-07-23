import { Request, Response } from 'express';
import journalService, { JournalEntry } from '../services/journalService';
import { JournalEntrySchema } from '../../../shared/types';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

// Derived from the canonical schema so the shared contract stays the single source
// of truth — and so a client structurally cannot set its own userId.
const CreateEntryBodySchema = JournalEntrySchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true });
const UpdateEntryBodySchema = CreateEntryBodySchema.partial();

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

// Controller for Journal Entries
export const createEntry = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const data = CreateEntryBodySchema.parse(req.body);

    const entry = await journalService.createEntry(userId, data);

    return res.status(201).json({
        success: true,
        data: entry,
        error: null
    } as ApiResponse<JournalEntry>);
});

export const getEntries = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);

    const month = req.query.month as string | undefined;
    const entries = month
        ? await journalService.getEntriesByMonth(userId, month)
        : await journalService.getEntries(userId, 30);

    return res.status(200).json({
        success: true,
        data: entries,
        error: null
    } as ApiResponse<JournalEntry[]>);
});

export const updateEntry = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;
    const data = UpdateEntryBodySchema.parse(req.body);

    await journalService.updateEntry(userId, id as string, data);

    return res.status(200).json({
        success: true,
        data: { id, ...data },
        error: null
    } as ApiResponse<unknown>);
});

export const deleteEntry = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { id } = req.params;

    await journalService.deleteEntry(userId, id as string);

    return res.status(200).json({
        success: true,
        data: { id, deleted: true },
        error: null
    } as ApiResponse<unknown>);
});
