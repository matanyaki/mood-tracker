// src/services/journalService.ts
import { API_BASE_URL } from '../config/api';
import { JournalEntry } from '../models/JournalEntry'; // Import the Model

const ENTRIES_API_URL = `${API_BASE_URL}/api/entries`;

export const JournalService = {

  // Notice we now enforce the 'JournalEntry' type on the input
  addEntry: async (entryData: Omit<JournalEntry, 'id'>) => {
    try {
      const response = await fetch(ENTRIES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${userToken}`, // TODO: Integrate Firebase Auth token
          'x-mock-user-id': entryData.userId // Send userId as header for mock auth in dev
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.id;
    } catch (error) {
      // In a pro app, we would log this to a service like Sentry
      console.error("Backend Error [addEntry]:", error);
      throw error;
    }
  },

  getUserEntries: async (userId: string): Promise<JournalEntry[]> => {
    try {
      const response = await fetch(`${ENTRIES_API_URL}`, {
        headers: {
          // 'Authorization': `Bearer ${userToken}`,
          'x-mock-user-id': userId // Send userId as header for mock auth in dev
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }

      const responseData = await response.json();
      // Assuming backend returns { success: true, data: JournalEntry[], ... }
      const entries = responseData.data as JournalEntry[];

      // Client-side sort if backend doesn't sort or just to be safe
      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Backend Error [getUserEntries]:", error);
      throw error;
    }
  },

  getStats: async (userId: string) => {

    const entries = await JournalService.getUserEntries(userId);
    const counts: Record<string, number> = {};
    let total = 0;

    entries.forEach(entry => {
      const primary = entry.emotion || 'Unknown';
      counts[primary] = (counts[primary] || 0) + 1;
      total++;
    });

    return { counts, total };
  },

  deleteEntry: async (entryId: string, userId: string) => {
    try {
      const response = await fetch(`${ENTRIES_API_URL}/${entryId}`, {
        method: 'DELETE',
        headers: {
          'x-mock-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete entry: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Backend Error [deleteEntry]:", error);
      throw error;
    }
  },

  updateEntry: async (entryId: string, updates: Partial<JournalEntry>) => {
    try {
      const response = await fetch(`${ENTRIES_API_URL}/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': updates.userId || 'test-user-id' // Ideally get from auth context
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Backend Error [updateEntry]:", error);
      throw error;
    }
  }
};