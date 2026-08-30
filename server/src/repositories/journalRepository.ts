import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import { BaseRepository } from './baseRepository';
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from '@shared/types';

class JournalRepository extends BaseRepository<JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO> {
    
    protected getCollection(userId: string): FirebaseFirestore.CollectionReference {
        if (!db) throw new Error('Firestore is not initialized.');
        return db.collection('users').doc(userId).collection('entries');
    }

    async findAll(userId: string, days?: number): Promise<JournalEntry[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        let query: FirebaseFirestore.Query = this.getCollection(userId);
        
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

        return snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = data.createdAt;
            let updatedAt = data.updatedAt;

            if (createdAt && typeof createdAt.toDate === 'function') {
                createdAt = createdAt.toDate();
            }
            if (updatedAt && typeof updatedAt.toDate === 'function') {
                updatedAt = updatedAt.toDate();
            }

            return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt
            } as JournalEntry;
        });
    }

    async getEntriesByMonth(userId: string, yearMonth: string): Promise<JournalEntry[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const query = this.getCollection(userId)
            .where('date', '>=', `${yearMonth}-01`)
            .where('date', '<=', `${yearMonth}-31`)
            .orderBy('date', 'desc');

        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = data.createdAt;
            let updatedAt = data.updatedAt;

            if (createdAt && typeof createdAt.toDate === 'function') {
                createdAt = createdAt.toDate();
            }
            if (updatedAt && typeof updatedAt.toDate === 'function') {
                updatedAt = updatedAt.toDate();
            }

            return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt
            } as JournalEntry;
        });
    }

    async getEmotionCounts(userId: string, days?: number, month?: string): Promise<Record<string, number>> {
        if (!db) throw new Error('Firestore is not initialized.');
        
        let query: FirebaseFirestore.Query = this.getCollection(userId);
        
        // A month is an absolute window, `days` a rolling one — the Insights screen
        // asks for a specific month, so that wins when both are supplied. Same date
        // predicate as getEntriesByMonth, so counts and entries agree on the window.
        if (month) {
            query = query
                .where('date', '>=', `${month}-01`)
                .where('date', '<=', `${month}-31`);
        } else if (days) {
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
                    const key = emotion.id;
                    counts[key] = (counts[key] || 0) + 1;
                });
            }
        });

        return counts;
    }
}

export const journalRepository = new JournalRepository();
