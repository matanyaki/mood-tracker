import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
    
    /**
     * Subclasses must provide the appropriate Firestore collection reference.
     * @param userId Optional userId if the collection is a user subcollection.
     */
    protected abstract getCollection(userId?: string): FirebaseFirestore.CollectionReference;

    /**
     * Create a new document in the collection.
     * @param userId The ID of the user (if applicable).
     * @param data The data to insert.
     * @param explicitId Optional explicit ID to use for the document.
     */
    async create(userId: string | undefined, data: CreateDTO, explicitId?: string): Promise<T> {
        if (!db) throw new Error('Firestore is not initialized.');
        
        const collection = this.getCollection(userId);
        
        const docData = {
            ...data,
            ...(userId ? { userId } : {}), // only attach userId if it's provided and truthy
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp()
        };

        let docRef: FirebaseFirestore.DocumentReference;
        if (explicitId) {
            docRef = collection.doc(explicitId);
            await docRef.set(docData);
        } else {
            docRef = await collection.add(docData);
        }

        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('Failed to retrieve the created entry.');
        }

        return {
            id: docRef.id,
            ...docSnapshot.data()
        } as unknown as T;
    }

    /**
     * Get all documents in the collection.
     * @param userId The ID of the user (if applicable).
     */
    async findAll(userId?: string): Promise<T[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const collection = this.getCollection(userId);
        const snapshot = await collection.get();

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
            } as unknown as T;
        });
    }

    /**
     * Get a document by its ID.
     * @param userId The ID of the user (if applicable).
     * @param id The ID of the document.
     */
    async findById(userId: string | undefined, id: string): Promise<T | null> {
        if (!db) throw new Error('Firestore is not initialized.');

        const collection = this.getCollection(userId);
        const docRef = collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data()!;
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
        } as unknown as T;
    }

    /**
     * Update an existing document.
     * @param userId The ID of the user (if applicable).
     * @param id The ID of the document.
     * @param data The data to update.
     */
    async update(userId: string | undefined, id: string, data: UpdateDTO): Promise<void> {
        if (!db) throw new Error('Firestore is not initialized.');

        const collection = this.getCollection(userId);
        const docRef = collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Entry not found.');
        }

        await docRef.update({
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Delete a document.
     * @param userId The ID of the user (if applicable).
     * @param id The ID of the document.
     */
    async delete(userId: string | undefined, id: string): Promise<void> {
        if (!db) throw new Error('Firestore is not initialized.');

        const collection = this.getCollection(userId);
        const docRef = collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Entry not found.');
        }

        await docRef.delete();
    }
}
