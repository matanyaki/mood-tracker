import { greetingRepository } from '../repositories/greetingRepository';
import { rethrow } from '../middleware/errorHandler';
import type { Greeting, CreateGreetingDTO } from '../../../shared/types';

class GreetingService {
    /**
     * Create a new greeting entry
     */
    async createGreeting(userId: string, text: string): Promise<Greeting> {
        try {
            const data: CreateGreetingDTO = { text };
            return await greetingRepository.create(userId, data);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to create greeting');
        }
    }

    /**
     * Get all greetings for a user
     */
    async getGreetings(userId: string): Promise<Greeting[]> {
        try {
            return await greetingRepository.findAll(userId);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch greetings');
        }
    }
}

export default new GreetingService();
