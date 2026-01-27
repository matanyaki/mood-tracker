// src/services/journalService.ts
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { JournalEntry } from '../models/JournalEntry'; // Import the Model

export const JournalService = {

  // Notice we now enforce the 'JournalEntry' type on the input
  addEntry: async (entryData: Omit<JournalEntry, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'entries'), entryData);
      return docRef.id;
    } catch (error) {
      // In a pro app, we would log this to a service like Sentry
      console.error("Backend Error [addEntry]:", error);
      throw error;
    }
  },

  getUserEntries: async (userId: string): Promise<JournalEntry[]> => {
    try {
      const q = query(
        collection(db, 'entries'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);

      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JournalEntry[];

      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Backend Error [getUserEntries]:", error);
      throw error;
    }
  },

  getStats: async (userId: string) => {
    // Logic remains the same, but now it's type-safe
    const entries = await JournalService.getUserEntries(userId);
    const counts: Record<string, number> = {};
    let total = 0;

    entries.forEach(entry => {
      const primary = entry.primaryEmotion || 'Unknown';
      counts[primary] = (counts[primary] || 0) + 1;
      total++;
    });

    return { counts, total };
  }
};