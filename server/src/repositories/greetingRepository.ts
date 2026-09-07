import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import { BaseRepository } from './baseRepository';
import type { Greeting, CreateGreetingDTO } from '../../../shared/types';

class GreetingRepository extends BaseRepository<Greeting, CreateGreetingDTO, Partial<CreateGreetingDTO>> {
    
    protected getCollection(userId: string): FirebaseFirestore.CollectionReference {
        if (!db) throw new Error('Firestore is not initialized.');
        return db.collection('users').doc(userId).collection('greetings');
    }

    async findAll(userId: string): Promise<Greeting[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const snapshot = await this.getCollection(userId)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = data.createdAt;
            
            if (createdAt && typeof createdAt.toDate === 'function') {
                createdAt = createdAt.toDate();
            }

            return {
                id: doc.id,
                userId: data.userId,
                text: data.text,
                createdAt: createdAt
            } as Greeting;
        });
    }

    /**
     * When recent greetings were written, as epoch ms, and nothing else.
     *
     * The counterpart to journalRepository.getRecentTimestamps — `.select` keeps the
     * greeting text out of a query that only cares about days.
     *
     * A greeting has no date field at all, so `createdAt` is the only day source
     * there is. It is a SERVER timestamp, i.e. the moment the backend wrote the
     * document, so a greeting saved within a second of local midnight can land on
     * the neighbouring day.
     */
    async getRecentCreatedAtMillis(userId: string, sinceMs: number): Promise<number[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const snapshot = await this.getCollection(userId)
            .where('createdAt', '>=', firestore.Timestamp.fromMillis(sinceMs))
            .select('createdAt')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs
            .map(doc => doc.data().createdAt)
            // A document written a moment ago can still hold the unresolved sentinel
            // instead of a Timestamp, so check before converting.
            .filter(createdAt => createdAt && typeof createdAt.toMillis === 'function')
            .map(createdAt => createdAt.toMillis() as number);
    }
}

export const greetingRepository = new GreetingRepository();
