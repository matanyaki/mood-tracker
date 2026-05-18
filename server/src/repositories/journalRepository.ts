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
    createdAt?: Date | firestore.Timestamp;
    updatedAt?: Date | firestore.Timestamp;
    [key: string]: any;
}

export type CreateJournalEntryDTO = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>;

class JournalRepository {
    async create(userId: string, data: CreateJournalEntryDTO): Promise<JournalEntry> {
        if (!db) throw new Error('Firestore is not initialized.');

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
    }

    async findAll(userId: string, days?: number): Promise<JournalEntry[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        let query: FirebaseFirestore.Query = db.collection('users').doc(userId).collection('entries');
        
        if (days) {
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            console.log(`[Repository] Query Cutoff (ms):`, cutoff, ` | Current Time:`, Date.now());
            query = query.where('timestamp', '>=', cutoff);
        }

        const snapshot = await query.orderBy('timestamp', 'desc').get();
        console.log(`[Repository] Snapshot Empty?`, snapshot.empty, ` | Docs Found:`, snapshot.docs.length);

        if (!snapshot.empty) {
            console.log(`[Repository] Sample DB Timestamp:`, snapshot.docs[0].data().timestamp);
        }

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as JournalEntry[];
    }

    async findById(userId: string, entryId: string): Promise<JournalEntry | null> {
        if (!db) throw new Error('Firestore is not initialized.');

        const docRef = db.collection('users').doc(userId).collection('entries').doc(entryId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        } as JournalEntry;
    }

    async update(userId: string, entryId: string, data: UpdateJournalEntryDTO): Promise<void> {
        if (!db) throw new Error('Firestore is not initialized.');

        const docRef = db.collection('users').doc(userId).collection('entries').doc(entryId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Entry not found.');
        }

        await docRef.update({
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp()
        });
    }

    async delete(userId: string, entryId: string): Promise<void> {
        if (!db) throw new Error('Firestore is not initialized.');

        const docRef = db.collection('users').doc(userId).collection('entries').doc(entryId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Entry not found.');
        }

        await docRef.delete();
    }

    async getEmotionCounts(userId: string, days?: number): Promise<Record<string, number>> {
        if (!db) throw new Error('Firestore is not initialized.');
        
        let query: FirebaseFirestore.Query = db.collection('users').doc(userId).collection('entries');
        
        if (days) {
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            query = query.where('timestamp', '>=', cutoff);
        }

        const snapshot = await query.get();
        const counts: Record<string, number> = {};

        if (snapshot.empty) return counts;

        snapshot.docs.forEach(doc => {
            const data = doc.data() as JournalEntry;
            if (data.emotions && Array.isArray(data.emotions)) {
                data.emotions.forEach(emotion => {
                    const key = (emotion.id || emotion.label || 'unknown').toLowerCase();
                    counts[key] = (counts[key] || 0) + 1;
                });
            }
        });

        return counts;
    }
}

export const journalRepository = new JournalRepository();
