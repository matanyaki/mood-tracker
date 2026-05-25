import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import { BaseRepository } from './baseRepository';
import type { JournalEntry, CreateJournalEntryDTO, UpdateJournalEntryDTO } from '../../../shared/types';

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

    async getEmotionCounts(userId: string, days?: number): Promise<Record<string, number>> {
        if (!db) throw new Error('Firestore is not initialized.');
        
        let query: FirebaseFirestore.Query = this.getCollection(userId);
        
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
