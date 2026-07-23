import { journalRepository } from '../repositories/journalRepository';
import { rethrow } from '../middleware/errorHandler';
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from '../../../shared/types';

export type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO };

class JournalService {
    /**
     * Create a new journal entry.
     */
    async createEntry(userId: string, data: CreateJournalEntryDTO): Promise<JournalEntry> {
        try {
            return await journalRepository.create(userId, data);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to create journal entry');
        }
    }

    /**
     * Get all journal entries for a specific user.
     */
    async getEntries(userId: string, days?: number): Promise<JournalEntry[]> {
        try {
            return await journalRepository.findAll(userId, days);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch journal entries');
        }
    }

    /**
     * Get journal entries for a specific month.
     */
    async getEntriesByMonth(userId: string, yearMonth: string): Promise<JournalEntry[]> {
        try {
            return await journalRepository.getEntriesByMonth(userId, yearMonth);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch journal entries by month');
        }
    }

    /**
     * Update an existing journal entry.
     */
    async updateEntry(userId: string, entryId: string, data: UpdateJournalEntryDTO): Promise<void> {
        try {
            await journalRepository.update(userId, entryId, data);
        } catch (error: unknown) {
            rethrow(error, `Failed to update journal entry ${entryId}`);
        }
    }

    /**
     * Delete a journal entry.
     */
    async deleteEntry(userId: string, entryId: string): Promise<void> {
        try {
            await journalRepository.delete(userId, entryId);
        } catch (error: unknown) {
            rethrow(error, `Failed to delete journal entry ${entryId}`);
        }
    }
}

export default new JournalService();
