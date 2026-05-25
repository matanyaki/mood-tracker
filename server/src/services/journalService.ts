import { journalRepository } from '../repositories/journalRepository';
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from '../../../shared/types';

export type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO };

class JournalService {
    /**
     * Create a new journal entry.
     */
    async createEntry(userId: string, data: CreateJournalEntryDTO): Promise<JournalEntry> {
        try {
            return await journalRepository.create(userId, data);
        } catch (error: any) {
            console.error('Error creating journal entry:', error);
            throw new Error(`Failed to create journal entry: ${error.message}`);
        }
    }

    /**
     * Get all journal entries for a specific user.
     */
    async getEntries(userId: string, days?: number): Promise<JournalEntry[]> {
        try {
            return await journalRepository.findAll(userId, days);
        } catch (error: any) {
            console.error('Error fetching journal entries:', error);
            throw new Error(`Failed to fetch journal entries: ${error.message}`);
        }
    }

    /**
     * Update an existing journal entry.
     */
    async updateEntry(userId: string, entryId: string, data: UpdateJournalEntryDTO): Promise<void> {
        try {
            await journalRepository.update(userId, entryId, data);
        } catch (error: any) {
            console.error(`Error updating journal entry ${entryId}:`, error);
            throw new Error(`Failed to update journal entry: ${error.message}`);
        }
    }

    /**
     * Delete a journal entry.
     */
    async deleteEntry(userId: string, entryId: string): Promise<void> {
        try {
            await journalRepository.delete(userId, entryId);
        } catch (error: any) {
            console.error(`Error deleting journal entry ${entryId}:`, error);
            throw new Error(`Failed to delete journal entry: ${error.message}`);
        }
    }
}

export default new JournalService();
