// src/services/journalService.ts
import { z } from 'zod';
import type { JournalEntry, EntryStats } from '@shared/types';
import { JournalEntrySchema, EntryStatsSchema } from '../../shared/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
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

        const finalData = {
          ...entryData,
          createdAt: new Date().toISOString()
        };

        const created = await api.post('/api/entries', finalData);
        return JournalEntrySchema.parse(created).id;
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

        console.log(`[JournalService] Fetching entries for userId: ${userId}${month ? ` (month: ${month})` : ''}`);
        const result = await api.get('/api/entries', {
          params: month ? { month } : undefined,
        });
        return z.array(JournalEntrySchema).parse(result);
      }
    } catch (error) {
      console.error("Error [getUserEntries]:", error);
      throw error;
    }
  },

  /**
   * Get emotion counts for a month.
   * - Authenticated: GET /api/entries/stats — the server aggregates, the client displays.
   * - Guest: counted locally, because guest data never reaches the backend at all.
   */
  getEntryStats: async (userId: string, month: string): Promise<EntryStats> => {
    try {
      if (userId === GUEST_ID) {
        // --- LOCAL STORAGE ---
        const entries = await JournalService.getUserEntries(userId, month);
        return entries.reduce<EntryStats>((counts, entry) => {
          entry.emotions?.forEach(emotion => {
            counts[emotion.id] = (counts[emotion.id] || 0) + 1;
          });
          return counts;
        }, {});

      } else {
        // --- API (Authenticated) ---
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated.");

        console.log(`[JournalService] Fetching entry stats (month: ${month})`);
        const result = await api.get('/api/entries/stats', { params: { month } });
        return EntryStatsSchema.parse(result);
      }
    } catch (error) {
      console.error("Error [getEntryStats]:", error);
      throw error;
    }
  },

  GUEST_STORAGE_KEY,
  GUEST_ID
};