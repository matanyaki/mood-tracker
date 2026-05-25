import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import type { Greeting } from '@shared/types';

const GUEST_GREETINGS_KEY = '@guest_greetings';

export const GreetingService = {
    /**
    * Add a new greeting.
    * - Authenticated: Saves via Custom Backend API
    * - Guest: Saves to AsyncStorage
    */
    addGreeting: async (userId: string, text: string): Promise<Greeting> => {
        try {
            if (!userId || userId === 'guest-user') {
                // --- LOCAL STORAGE (Guest) ---
                const existingJson = await AsyncStorage.getItem(GUEST_GREETINGS_KEY);
                const existing: Greeting[] = existingJson ? JSON.parse(existingJson) : [];

                const newGreeting: Greeting = {
                    id: Date.now().toString(),
                    userId: 'guest-user',
                    text,
                    createdAt: new Date().toISOString()
                };

                await AsyncStorage.setItem(GUEST_GREETINGS_KEY, JSON.stringify([newGreeting, ...existing]));
                return newGreeting;

            } else {
                // --- API (Authenticated) ---
                console.log(`[GreetingService] Uploading greeting for user via API`);

                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                const token = await user.getIdToken();

                const finalData = {
                    userId,
                    text
                };

                const response = await fetch(`${API_BASE_URL}/api/greetings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(finalData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create greeting: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                return result.data as Greeting;
            }
        } catch (error) {
            console.error("Error adding greeting:", error);
            throw error;
        }
    },

    /**
     * Get all greetings for a user.
     */
    getUserGreetings: async (userId: string): Promise<Greeting[]> => {
        try {
            if (!userId || userId === 'guest-user') {
                const existingJson = await AsyncStorage.getItem(GUEST_GREETINGS_KEY);
                const greetings: Greeting[] = existingJson ? JSON.parse(existingJson) : [];
                return greetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                const token = await user.getIdToken();

                const url = `${API_BASE_URL}/api/greetings?userId=${userId}`;
                console.log(`[GreetingService] Fetching GET ${url}`);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`[GreetingService] GET Response Status:`, response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[GreetingService] GET Error Text:`, errorText);
                    throw new Error(`Failed to get greetings: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                console.log(`[GreetingService] GET Response JSON returned ${result.data?.length || 0} greetings`);
                return result.data as Greeting[];
            }
        } catch (error) {
            console.error("Error [getUserGreetings]:", error);
            throw error;
        }
    }
};
