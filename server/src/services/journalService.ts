import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';

export interface JournalEntry {
    id?: string;
    userId: string;
    date: string;       // YYYY-MM-DD
    timestamp: number;  // Unix timestamp from client

    emotions: Array<{
        id: string;
        label: string;
        scale: number;
        note?: string;
    }>;

    aiFeedback?: string;
    createdAt?: Date | firestore.Timestamp; // Server side
    updatedAt?: Date | firestore.Timestamp; // Server side
    [key: string]: any;
}

class JournalService {
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

            const docRef = await db.collection('users').doc(userId).collection('entries').add(entryData);
            const docSnapshot = await docRef.get();

            if (!docSnapshot.exists) {
                throw new Error('Failed to retrieve the created entry.');
            }

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
    async getEntries(userId: string, days?: number): Promise<JournalEntry[]> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            let query: FirebaseFirestore.Query = db.collection('users').doc(userId).collection('entries');
            
            if (days) {
                const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
                query = query.where('timestamp', '>=', cutoff);
            }

            const snapshot = await query.orderBy('timestamp', 'desc').get();

            if (snapshot.empty) {
                return [];
            }

            const entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as JournalEntry[];

            return entries;

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
            const docRef = db.collection('users').doc(userId).collection('entries').doc(entryId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Entry not found.');
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
            const docRef = db.collection('users').doc(userId).collection('entries').doc(entryId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Entry not found.');
            }

            await docRef.delete();
        } catch (error: any) {
            console.error(`Error deleting journal entry ${entryId}:`, error);
            throw new Error(`Failed to delete journal entry: ${error.message}`);
        }
    }
}

export default new JournalService();
