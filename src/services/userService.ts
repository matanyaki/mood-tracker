import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import { UserProfile } from '../models/UserProfile';
import { JournalEntry } from '../models/JournalEntry';

export const UserService = {
    /**
     * Creates a user document if it doesn't exist (Idempotent)
     */
    syncUser: async (user: any) => {
        try {
            if (!user || !user.uid) return;
            // The user must be authenticated, we'll wait for the token to be available
            // Note: If calling this right upon signup, might take a second for token.
            const token = await user.getIdToken();

            await fetch(`${API_BASE_URL}/api/users/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user })
            });
        } catch (error) {
            console.error("Error syncing user profile:", error);
            // We swallow the error so it doesn't block the app flow/migration
        }
    },

    /**
     * Updates stats when a user adds a new entry
     */
    incrementEntryCount: async (userId: string) => {
        if (!userId) return;
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            await fetch(`${API_BASE_URL}/api/users/increment-entry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        try {
            // API (Authenticated)
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated.");

            const token = await user.getIdToken();

            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get profile: ${response.status}`);
            }

            const result = await response.json();
            return result.data as UserProfile;
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