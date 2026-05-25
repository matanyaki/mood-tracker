// src/services/journalService.ts
import type { JournalEntry } from '@shared/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';

const GUEST_STORAGE_KEY = '@guest_journal_entries';
const GUEST_ID = 'guest-user';

export const JournalService = {

  // Helper to check if we should use local storage
  isGuest: (userId: string) => userId === GUEST_ID,

  /**
   * Add a new journal entry.
   * - Authenticated: Saves via Custom Backend API
   * - Guest: Saves to AsyncStorage
   */
  addEntry: async (entryData: Omit<JournalEntry, 'id'>) => {
    try {
      if (entryData.userId === GUEST_ID) {
        // --- LOCAL STORAGE (Guest) ---
        const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        const existingEntries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

        const newEntry: JournalEntry = {
          ...entryData,
          id: Date.now().toString(),
        };

        const updatedEntries = [newEntry, ...existingEntries];
        await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedEntries));
        return newEntry.id;

      } else {
        // --- API (Authenticated) ---
        console.log(`[JournalService] Uploading entry for user via API`);
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        const token = await user.getIdToken();

        const finalData = {
          ...entryData,
          createdAt: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/api/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(finalData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create entry: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result.data.id;
      }
    } catch (error) {
      console.error("Error [addEntry]:", error);
      throw error;
    }
  },

  /**
   * Get all entries for a user.
   * - Authenticated: Fetches via Custom Backend API
   * - Guest: Fetches from AsyncStorage
   */
  getUserEntries: async (userId: string): Promise<JournalEntry[]> => {
    try {
      if (userId === GUEST_ID) {
        // --- LOCAL STORAGE ---
        const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        const entries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
        return entries.sort((a, b) => b.timestamp - a.timestamp);

      } else {
        // --- API (Authenticated) ---
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        const token = await user.getIdToken();

        const url = `${API_BASE_URL}/api/entries`;
        console.log(`[JournalService] Fetching GET ${url} for userId: ${userId}`);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`[JournalService] GET ${url} Response Status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[JournalService] GET ${url} Error Text:`, errorText);
          throw new Error(`Failed to get entries: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`[JournalService] GET ${url} Response JSON:`, result);
        return result.data as JournalEntry[];
      }
    } catch (error) {
      console.error("Error [getUserEntries]:", error);
      throw error;
    }
  },

  getStats: async (userId: string) => {
    const entries = await JournalService.getUserEntries(userId);
    const counts: Record<string, number> = {};
    let totalEmotionCount = 0;
    let totalEntriesCount = 0;

    entries.forEach(entry => {
      totalEntriesCount++;
      // Iterate through ALL emotions in the entry
      if (entry.emotions && entry.emotions.length > 0) {
        entry.emotions.forEach(emotionItem => {
          // Normalize to lowercase for ID/Key consistency
          const key = (emotionItem.id || emotionItem.label || 'unknown').toLowerCase();

          counts[key] = (counts[key] || 0) + 1;
          totalEmotionCount++;
        });
      } else {
        // Fallback for legacy/broken entries (casting to any to bypass TS error)
        const key = ((entry as any).emotion || 'unknown').toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
        totalEmotionCount++;
      }
    });

    return { counts, total: totalEmotionCount, totalEntries: totalEntriesCount };
  },

  deleteEntry: async (entryId: string, userId: string) => {
    try {
      if (userId === GUEST_ID) {
        // --- LOCAL STORAGE ---
        const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        if (!existingEntriesJson) return false;

        const entries: JournalEntry[] = JSON.parse(existingEntriesJson);
        const updatedEntries = entries.filter(e => e.id !== entryId);

        await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedEntries));
        return true;

      } else {
        // --- API (Authenticated) ---
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete entry: ${response.status}`);
        }

        return true;
      }
    } catch (error) {
      console.error("Error [deleteEntry]:", error);
      throw error;
    }
  },

  updateEntry: async (entryId: string, updates: Partial<JournalEntry>) => {
    try {
      const localData = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
      let isLocal = false;
      let localEntries: JournalEntry[] = [];

      if (localData) {
        localEntries = JSON.parse(localData);
        if (localEntries.some(e => e.id === entryId)) {
          isLocal = true;
        }
      }

      const targetUserId = updates.userId || (isLocal ? GUEST_ID : null);

      if (targetUserId === GUEST_ID || isLocal) {
        // --- LOCAL STORAGE ---
        if (!localEntries.length && localData) localEntries = JSON.parse(localData);

        const index = localEntries.findIndex(e => e.id === entryId);
        if (index === -1) throw new Error("Entry not found locally");

        const updatedEntry = { ...localEntries[index], ...updates, updatedAt: new Date().toISOString() };
        localEntries[index] = updatedEntry;

        await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(localEntries));
        return updatedEntry;

      } else if (targetUserId) {
        // --- API (Authenticated) ---
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          throw new Error(`Failed to update entry: ${response.status}`);
        }

        const result = await response.json();
        return result.data as JournalEntry;
      } else {
        throw new Error("Cannot update entry: Missing userId to determine storage location.");
      }

    } catch (error) {
      console.error("Error [updateEntry]:", error);
      throw error;
    }
  },

  GUEST_STORAGE_KEY,
  GUEST_ID
};