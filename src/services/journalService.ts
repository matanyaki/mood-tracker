// src/services/journalService.ts
import { db } from '../config/firebase'; // Ensure this exports your initialized Firestore instance
import { collection, doc, addDoc, getDocs, deleteDoc, updateDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { JournalEntry } from '../models/JournalEntry';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_STORAGE_KEY = '@guest_journal_entries';
const GUEST_ID = 'guest-user';

export const JournalService = {

  // Helper to check if we should use local storage
  isGuest: (userId: string) => userId === GUEST_ID,

  /**
   * Add a new journal entry.
   * - Authenticated: Saves to Firestore at `users/{userId}/entries`
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
        // --- FIRESTORE (Authenticated) ---
        // Path: users/{uid}/entries
        console.log(`[JournalService] Uploading entry for user: ${entryData.userId}`);
        const userEntriesRef = collection(db, 'users', entryData.userId, 'entries');

        // Add timestamp if missing
        const finalData = {
          ...entryData,
          createdAt: new Date().toISOString()
        };
        console.log(`[JournalService] Payload: ${JSON.stringify(finalData)}`);

        const docRef = await addDoc(userEntriesRef, finalData);
        console.log(`[JournalService] Upload successful. ID: ${docRef.id}`);
        return docRef.id;
      }
    } catch (error) {
      console.error("Error [addEntry]:", error);
      throw error;
    }
  },

  /**
   * Get all entries for a user.
   * - Authenticated: Fetches from `users/{userId}/entries`
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
        // --- FIRESTORE ---
        const userEntriesRef = collection(db, 'users', userId, 'entries');
        // Order by timestamp descending
        const q = query(userEntriesRef, orderBy('timestamp', 'desc'));

        const snapshot = await getDocs(q);

        const entries: JournalEntry[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as JournalEntry));

        return entries;
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

    // Return total entries for the summary card, but totalEmotionCount for chart calc if needed
    // The Controller expects 'total' to use as denominator. 
    // To fix >100% bars if multiple checked, we should return totalEmotionCount as 'totalForChart'
    // But to minimize breaking changes, let's return { counts, total: totalEmotionCount, totalEntries: totalEntriesCount }
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
        // --- FIRESTORE ---
        // We delete directly from the path: users/{userId}/entries/{entryId}
        const entryRef = doc(db, 'users', userId, 'entries', entryId);
        await deleteDoc(entryRef);
        return true;
      }
    } catch (error) {
      console.error("Error [deleteEntry]:", error);
      throw error;
    }
  },

  updateEntry: async (entryId: string, updates: Partial<JournalEntry>) => {
    try {
      // Determine User ID (Guest vs Auth)
      // We prioritize checking the updates object for userId, or inferring from storage presence

      // 1. Check Local first
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
        // --- FIRESTORE ---
        // Update document at users/{userId}/entries/{entryId}
        const entryRef = doc(db, 'users', targetUserId, 'entries', entryId);

        // We only send the fields that are in 'updates'
        // @ts-ignore - updates might have extra fields? strict typing is safer but for now:
        await updateDoc(entryRef, updates);

        // Fetch updated doc to return consistent format
        // (Optional, or just return merged data)
        const snap = await getDoc(entryRef);
        return { id: snap.id, ...snap.data() } as JournalEntry;
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