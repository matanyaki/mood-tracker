import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';


export interface JournalEntry {
    id?: string;
    userId: string;
    date: string;       // YYYY-MM-DD
    timestamp: number;  // Unix timestamp from client

    // NEW SIMPLIFIED
    emotion: string;    // "Happy", "Sad", etc.
    scale: number;      // 1-5
    note?: string;

    aiFeedback?: string;
    createdAt?: Date | firestore.Timestamp; // Server side
    updatedAt?: Date | firestore.Timestamp; // Server side
    [key: string]: any;
}

class JournalService {
    private collectionName = 'journal_entries';

    /**
     * Create a new journal entry in Firestore.
     * Automatically adds a server-side timestamp.
     */
    async createEntry(userId: string, data: Omit<JournalEntry, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<JournalEntry> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            const entryData = {
                ...data,
                userId,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection(this.collectionName).add(entryData);
            const docSnapshot = await docRef.get();

            if (!docSnapshot.exists) {
                throw new Error('Failed to retrieve the created entry.');
            }

            // Return the created entry with its ID and resolved timestamps (if needed, though serverTimestamp is special)
            // For the client, we might want to return the client-friendly date or just the data as is.
            return {
                id: docRef.id,
                ...docSnapshot.data()
            } as JournalEntry;
        } catch (error: any) {
            console.error('Error creating journal entry:', error);
            throw new Error(`Failed to create journal entry: ${error.message}`);
        }
    }

    /**
     * Get all journal entries for a specific user.
     */
    async getEntries(userId: string): Promise<JournalEntry[]> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            // Firestore requires an index for 'where' + 'orderBy' on different fields.
            // Sorting in memory for now to avoid blocking dev.
            const snapshot = await db.collection(this.collectionName)
                .where('userId', '==', userId)
                // .orderBy('createdAt', 'desc') 
                .get();

            if (snapshot.empty) {
                return [];
            }

            const entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as JournalEntry[];

            // Sort in memory (Newest first)
            return entries.sort((a, b) => {
                // Handle Firestore Timestamp or standard Date
                const getMillis = (d: any) => {
                    if (d && typeof d.toMillis === 'function') return d.toMillis();
                    if (d instanceof Date) return d.getTime();
                    return 0;
                };
                return getMillis(b.createdAt) - getMillis(a.createdAt);
            });

        } catch (error: any) {
            console.error('Error fetching journal entries:', error);
            throw new Error(`Failed to fetch journal entries: ${error.message}`);
        }
    }

    /**
     * Update an existing journal entry.
     * Ensures the entry belongs to the user requesting the update.
     */
    async updateEntry(userId: string, entryId: string, data: Partial<Omit<JournalEntry, 'userId' | 'createdAt' | 'updatedAt' | 'id'>>): Promise<void> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            const docRef = db.collection(this.collectionName).doc(entryId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Entry not found.');
            }

            if (doc.data()?.userId !== userId) {
                throw new Error('Unauthorized: You can only update your own entries.');
            }

            await docRef.update({
                ...data,
                updatedAt: firestore.FieldValue.serverTimestamp()
            });
        } catch (error: any) {
            console.error(`Error updating journal entry ${entryId}:`, error);
            throw new Error(`Failed to update journal entry: ${error.message}`);
        }
    }

    /**
     * Delete a journal entry.
     * Ensures the entry belongs to the user requesting the deletion.
     */
    async deleteEntry(userId: string, entryId: string): Promise<void> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            const docRef = db.collection(this.collectionName).doc(entryId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Entry not found.');
            }

            if (doc.data()?.userId !== userId) {
                throw new Error('Unauthorized: You can only delete your own entries.');
            }

            await docRef.delete();
        } catch (error: any) {
            console.error(`Error deleting journal entry ${entryId}:`, error);
            throw new Error(`Failed to delete journal entry: ${error.message}`);
        }
    }
}

export default new JournalService();
