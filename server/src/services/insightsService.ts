import { journalRepository } from '../repositories/journalRepository';
import { rethrow } from '../middleware/errorHandler';

class InsightsService {
    /**
     * Calculate emotion counts directly from the repository.
     */
    async getEmotionCounts(userId: string, days?: number): Promise<Record<string, number>> {
        try {
            return await journalRepository.getEmotionCounts(userId, days);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to calculate emotion counts');
        }
    }
}

export default new InsightsService();
