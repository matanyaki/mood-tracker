import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';

export interface Greeting {
    id?: string;
    userId: string;
    text: string;
    createdAt?: Date | firestore.Timestamp;
}

export type CreateGreetingDTO = Omit<Greeting, 'id' | 'createdAt' | 'userId'>;

class GreetingRepository {
    async create(userId: string, data: CreateGreetingDTO): Promise<Greeting> {
        if (!db) throw new Error('Firestore is not initialized.');

        const greetingData = {
            ...data,
            userId,
            createdAt: firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('users').doc(userId).collection('greetings').add(greetingData);
        
        return {
            id: docRef.id,
            userId,
            text: data.text,
            createdAt: new Date()
        };
    }

    async findAll(userId: string): Promise<Greeting[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const snapshot = await db.collection('users').doc(userId).collection('greetings')
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

    async findById(userId: string, greetingId: string): Promise<Greeting | null> {
        if (!db) throw new Error('Firestore is not initialized.');

        const docRef = db.collection('users').doc(userId).collection('greetings').doc(greetingId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data()!;
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
    }
}

export const greetingRepository = new GreetingRepository();
