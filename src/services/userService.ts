// src/services/userService.ts
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../models/UserProfile';

export const UserService = {
    /**
     * Creates a user document if it doesn't exist (Idempotent)
     */
    syncUser: async (user: any) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create new profile
            const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                createdAt: new Date().toISOString(),
                preferences: { theme: 'system', notificationsEnabled: false },
                stats: { totalEntries: 0, currentStreak: 0 }
            };
            await setDoc(userRef, newProfile);
        }
    },

    /**
     * Updates stats when a user adds a new entry
     */
    incrementEntryCount: async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            "stats.totalEntries": increment(1),
            "stats.lastCheckInDate": new Date().toISOString().split('T')[0]
        });
    },

    /**
     * Get full profile
     */
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        return snap.exists() ? (snap.data() as UserProfile) : null;
    }
};