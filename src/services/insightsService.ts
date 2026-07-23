import { JournalService } from './journalService';
import type { JournalEntry } from '@shared/types';
import { auth } from '../config/firebase';


export const InsightsService = {
    getInsightsData: async (month?: string): Promise<JournalEntry[]> => {
        try {
            const user = auth.currentUser;
            const userId = user ? user.uid : JournalService.GUEST_ID;
            return await JournalService.getUserEntries(userId, month);
        } catch (error) {
            console.error("Error [InsightsService.getInsightsData]:", error);
            throw error;
        }
    }
};
