import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { JournalEntry, Greeting } from '@shared/types';
import { GUEST_STORAGE_KEY , GUEST_GREETINGS_KEY } from '../constants/variables';

export const UserService = {
    /**
     * Creates a user document if it doesn't exist (Idempotent)
     */
    syncUser: async (user: any) => {
        try {
            if (!user || !user.uid) return;
            // The request interceptor attaches the Firebase ID token automatically, and
            // the backend builds the profile from the uid on that verified token — it
            // ignores the body entirely. Send nothing: a Firebase User serialises its
            // stsTokenManager, which would put the refresh token in a plaintext HTTP body.
            await api.post('/api/users/sync');
        } catch (error) {
            console.error("Error syncing user profile:", error);
            // We swallow the error so it doesn't block the app flow/migration
        }
    },

    /**
     * Migrates guest data to Firebase
     * @param firebaseUser The authenticated Firebase user
     */
    migrateGuestData: async (firebaseUser: any) => {
        try {
            const guestEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
            const guestGreetingsJson = await AsyncStorage.getItem(GUEST_GREETINGS_KEY);

            const guestEntries: JournalEntry[] = guestEntriesJson ? JSON.parse(guestEntriesJson) : [];
            const guestGreetings: Greeting[] = guestGreetingsJson ? JSON.parse(guestGreetingsJson) : [];

            return {
                entries: guestEntries,
                greetings: guestGreetings
            };
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
            await Promise.all([
                AsyncStorage.removeItem(GUEST_STORAGE_KEY),
                AsyncStorage.removeItem(GUEST_GREETINGS_KEY)
            ]);
        } catch (error) {
            console.error("Error clearing guest data:", error);
        }
    }
};