import { journalRepository } from '../repositories/journalRepository';

class InsightsService {
    /**
     * Calculate emotion counts directly from the repository.
     */
    async getEmotionCounts(userId: string, days?: number): Promise<Record<string, number>> {
        try {
            return await journalRepository.getEmotionCounts(userId, days);
        } catch (error: any) {
            console.error('Error calculating emotion counts:', error);
            throw new Error(`Failed to calculate emotion counts: ${error.message}`);
        }
    }
}

export default new InsightsService();
