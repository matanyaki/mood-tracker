// src/services/journalService.ts
import type { JournalEntry } from '@shared/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import { GUEST_STORAGE_KEY , GUEST_ID } from '../constants/variables';

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
  getUserEntries: async (userId: string, month?: string): Promise<JournalEntry[]> => {
    try {
      if (userId === GUEST_ID) {
        // --- LOCAL STORAGE ---
        const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        let entries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
        
        if (month) {
          entries = entries.filter(e => e.date && e.date.startsWith(month));
        } else {
          // Default to last 30 days
          const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
          entries = entries.filter(e => e.timestamp >= cutoff);
        }
        
        return entries.sort((a, b) => b.timestamp - a.timestamp);

      } else {
        // --- API (Authenticated) ---
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        const token = await user.getIdToken();

        let url = `${API_BASE_URL}/api/entries`;
        if (month) {
          url += `?month=${month}`;
        }
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

  GUEST_STORAGE_KEY,
  GUEST_ID
};