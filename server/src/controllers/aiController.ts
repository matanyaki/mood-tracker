import { Request, Response } from 'express';
import aiService from '../services/aiService';

// Controller for AI Reflections
export const generateReflection = async (req: Request, res: Response) => {
    try {

        const { emotion, scale, note } = req.body;

        if (!emotion || !scale) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Emotion (string) and Scale (number) are required.'
            });
        }

        const reflection = await aiService.generateReflection({
            emotion,
            scale: Number(scale),
            note
        });

        return res.status(200).json({
            success: true,
            data: reflection,
            error: null
        });

    } catch (error: any) {
        console.error('Error generating AI reflection:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: error.message || 'Failed to generate reflection.'
        });
    }
};
