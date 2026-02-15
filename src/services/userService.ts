import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../models/UserProfile';
import { JournalEntry } from '../models/JournalEntry';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserService = {
    /**
     * Creates a user document if it doesn't exist (Idempotent)
     */
    syncUser: async (user: any) => {
        try {
            if (!user || !user.uid) return;
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new profile
                const newProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    createdAt: new Date().toISOString(),
                    preferences: { theme: 'system', notificationsEnabled: false },
                    stats: { totalEntries: 0, currentStreak: 0 }
                };
                await setDoc(userRef, newProfile);
            }
        } catch (error) {
            console.error("Error syncing user profile (likely permissions):", error);
            // We swallow the error so it doesn't block the app flow/migration
        }
    },

    /**
     * Updates stats when a user adds a new entry
     */
    incrementEntryCount: async (userId: string) => {
        if (!userId) return;
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, {
                "stats.totalEntries": increment(1),
                "stats.lastCheckInDate": new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error("Error incrementing entry count:", error);
        }
    },

    /**
     * Get full profile
     */
    getProfile: async (userId: string): Promise<UserProfile | null> => {
        if (!userId) return null;
        const userRef = doc(db, 'users', userId);
        try {
            const snap = await getDoc(userRef);
            return snap.exists() ? (snap.data() as UserProfile) : null;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    },

    /**
     * Migrates guest data to Firebase
     * @param firebaseUser The authenticated Firebase user
     */
    migrateGuestData: async (firebaseUser: any) => {
        try {
            const guestEntriesJson = await AsyncStorage.getItem('@guest_journal_entries');
            if (!guestEntriesJson) return;

            const guestEntries: JournalEntry[] = JSON.parse(guestEntriesJson);

            // Here we assume you have an API endpoint or a service function to bulk add entries 
            // OR simply loop and add them to Firestore via the existing API/Service.
            // For now, let's assume we use a specialized function or the existing JournalService.
            // BUT, strictly speaking, this service should probably call the API to save them.

            // However, typically you might want to do this via the API to keep logic consistent.
            // Since we are inside UserService, let's just use the API URL or helper from JournalService if available.

            // To avoid circular dependency if JournalService uses UserService, we will just fetch directly 
            // or return the data for the caller to handle. 
            // Actually, the best place is to return the data and let the caller (AuthContext) handle the API calls via JournalService.
            // OR, we can import JournalService here if there is no circular dependency.

            return guestEntries;
        } catch (error) {
            console.error("Migration failed:", error);
            throw error;
        }
    },

    /**
     * Clear guest data after successful migration
     */
    clearGuestData: async () => {
        try {
            await AsyncStorage.removeItem('@guest_journal_entries');
        } catch (error) {
            console.error("Error clearing guest data:", error);
        }
    }
};