import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import type { UserProfile, CreateUserProfileDTO, UpdateUserProfileDTO } from '../../../shared/types';

class UserRepository {
    async create(data: CreateUserProfileDTO): Promise<UserProfile> {
        if (!db) throw new Error('Firestore is not initialized.');

        const userRef = db.collection('users').doc(data.uid);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            return userSnap.data() as UserProfile;
        }

        const newProfile: UserProfile = {
            uid: data.uid,
            email: data.email || '',
            createdAt: new Date().toISOString(),
            preferences: { theme: 'system', notificationsEnabled: false },
            stats: { totalEntries: 0, currentStreak: 0 }
        };

        await userRef.set(newProfile);
        return newProfile;
    }

    async findById(userId: string): Promise<UserProfile | null> {
        if (!db) throw new Error('Firestore is not initialized.');

        const userRef = db.collection('users').doc(userId);
        const snap = await userRef.get();

        if (!snap.exists) {
            return null;
        }

        return snap.data() as UserProfile;
    }

    async update(userId: string, data: UpdateUserProfileDTO): Promise<void> {
        if (!db) throw new Error('Firestore is not initialized.');

        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            throw new Error('User not found.');
        }

        await userRef.update(data);
    }
}

export const userRepository = new UserRepository();
