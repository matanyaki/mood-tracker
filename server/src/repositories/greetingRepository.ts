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
}

export const greetingRepository = new GreetingRepository();
