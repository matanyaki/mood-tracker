
import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';

export interface Greeting {
    id?: string;
    userId: string;
    text: string;
    createdAt?: Date | firestore.Timestamp;
}

class GreetingService {
    // We don't use a top-level collection anymore
    // private collectionName = 'greetings';

    /**
     * Create a new greeting entry in users/{userId}/greetings
     */
    async createGreeting(userId: string, text: string): Promise<Greeting> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            const data = {
                userId,
                text,
                createdAt: firestore.FieldValue.serverTimestamp(),
            };

            // Use sub-collection: db.collection('users').doc(userId).collection('greetings')
            const docRef = await db.collection('users').doc(userId).collection('greetings').add(data);

            // Should verify creation? Not strictly needed for add() but good practice if rules might fail (backend bypasses rules though)
            // const docSnapshot = await docRef.get();

            return {
                id: docRef.id,
                userId,
                text,
                createdAt: new Date() // Approximate for response
            };
        } catch (error: any) {
            console.error('Error creating greeting:', error);
            throw new Error(`Failed to create greeting: ${error.message}`);
        }
    }

    /**
     * Get all greetings for a user from their sub-collection.
     */
    async getGreetings(userId: string): Promise<Greeting[]> {
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        try {
            const snapshot = await db.collection('users').doc(userId).collection('greetings')
                .orderBy('createdAt', 'desc')
                .get();

            if (snapshot.empty) {
                return [];
            }

            return snapshot.docs.map(doc => {
                const data = doc.data();
                let createdAt = data.createdAt;
                // Convert Firestore Timestamp to Date
                if (createdAt && typeof createdAt.toDate === 'function') {
                    createdAt = createdAt.toDate();
                }

                return {
                    id: doc.id,
                    userId: data.userId, // Although redundant in sub-coll, good to keep
                    text: data.text,
                    createdAt: createdAt
                } as Greeting;
            });
        } catch (error: any) {
            console.error('Error fetching greetings:', error);
            throw new Error(`Failed to fetch greetings: ${error.message}`);
        }
    }
}

export default new GreetingService();
