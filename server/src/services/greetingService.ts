import { greetingRepository } from '../repositories/greetingRepository';
import type { Greeting, CreateGreetingDTO } from '../../../shared/types';

class GreetingService {
    /**
     * Create a new greeting entry
     */
    async createGreeting(userId: string, text: string): Promise<Greeting> {
        try {
            const data: CreateGreetingDTO = { text };
            return await greetingRepository.create(userId, data);
        } catch (error: any) {
            console.error('Error creating greeting:', error);
            throw new Error(`Failed to create greeting: ${error.message}`);
        }
    }

    /**
     * Get all greetings for a user
     */
    async getGreetings(userId: string): Promise<Greeting[]> {
        try {
            return await greetingRepository.findAll(userId);
        } catch (error: any) {
            console.error('Error fetching greetings:', error);
            throw new Error(`Failed to fetch greetings: ${error.message}`);
        }
    }
}

export default new GreetingService();
