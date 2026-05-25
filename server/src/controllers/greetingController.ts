
import { Request, Response } from 'express';
import greetingService from '../services/greetingService';

export const createGreeting = async (req: Request, res: Response) => {
    try {
        console.log("[GreetingController] Received create request");
        console.log("[GreetingController] Body:", req.body);
        console.log("[GreetingController] User Context:", req.user);

        const userId = (req as any).user?.uid;
        if (req.body.userId) {
            delete req.body.userId;
        }
        
        const { text } = req.body;

        if (!userId) {
            console.error("[GreetingController] Missing userId");
            return res.status(401).json({ error: 'Unauthorized: Missing userId' });
        }
        if (!text) {
            console.error("[GreetingController] Missing text");
            return res.status(400).json({ error: 'Missing text' });
        }

        console.log(`[GreetingController] Creating greeting for user: ${userId}`);
        const greeting = await greetingService.createGreeting(userId, text);
        console.log("[GreetingController] Success:", greeting);
        res.status(201).json({ success: true, data: greeting });
    } catch (error: any) {
        console.error("Create Greeting Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getGreetings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Missing userId' });
        }

        const greetings = await greetingService.getGreetings(userId);
        res.status(200).json({ success: true, data: greetings });
    } catch (error: any) {
        console.error("Get Greetings Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
