import { Request, Response } from 'express';
import greetingService from '../services/greetingService';
import { Greeting, GreetingSchema } from '../../../shared/types';
import { asyncWrap } from '../middleware/errorHandler';
import { requireUid } from '../middleware/auth';

// Derived from the canonical schema. Omitting userId means an unknown-key strip
// (Zod's default) drops any client-supplied userId — the owner always comes from
// the verified token instead.
// NOTE: the length bound is a boundary concern applied locally; it arguably belongs
// on GreetingSchema itself, but shared/types is out of scope for this pass.
const CreateGreetingBodySchema = GreetingSchema
    .omit({ id: true, userId: true, createdAt: true })
    .extend({ text: GreetingSchema.shape.text.trim().min(1).max(2000) });

// Standardized response interface
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export const createGreeting = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);
    const { text } = CreateGreetingBodySchema.parse(req.body);

    const greeting = await greetingService.createGreeting(userId, text);

    return res.status(201).json({
        success: true,
        data: greeting,
        error: null
    } as ApiResponse<Greeting>);
});

export const getGreetings = asyncWrap(async (req: Request, res: Response) => {
    const userId = requireUid(req);

    const greetings = await greetingService.getGreetings(userId);

    return res.status(200).json({
        success: true,
        data: greetings,
        error: null
    } as ApiResponse<Greeting[]>);
});
