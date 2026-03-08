import { Request, Response } from 'express';
import userService from '../services/userService';

export const syncUser = async (req: Request, res: Response) => {
    try {
        const user = req.body.user;
        if (!user || !user.uid) {
            return res.status(400).json({ success: false, error: 'Missing user data' });
        }
        await userService.syncUser(user);
        res.status(200).json({ success: true, message: 'User synced successfully' });
    } catch (error: any) {
        console.error("Sync User Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const incrementEntryCount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing userId' });
        }
        await userService.incrementEntryCount(userId);
        res.status(200).json({ success: true, message: 'Stats updated successfully' });
    } catch (error: any) {
        console.error("Increment Entry Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        let userId = req.params.userId || req.user?.uid;
        if (Array.isArray(userId)) {
            userId = userId[0];
        }
        if (!userId || typeof userId !== 'string') {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing userId' });
        }
        const profile = await userService.getProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
