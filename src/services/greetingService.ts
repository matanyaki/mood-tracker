import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { auth } from '../config/firebase';
import { GUEST_ID , GUEST_GREETINGS_KEY } from '../constants/variables';
import type { Greeting } from '@shared/types';
import { GreetingSchema } from '../../shared/types';

export type { Greeting };

export const GreetingService = {
    /**
    * Add a new greeting.
    * - Authenticated: Saves via Custom Backend API
    * - Guest: Saves to AsyncStorage
    */
    addGreeting: async (userId: string, text: string): Promise<Greeting> => {
        try {
            if (!userId || userId === GUEST_ID) {
                // --- LOCAL STORAGE (Guest) ---
                const existingJson = await AsyncStorage.getItem(GUEST_GREETINGS_KEY);
                const existing: Greeting[] = existingJson ? JSON.parse(existingJson) : [];

                const newGreeting: Greeting = {
                    id: Date.now().toString(),
                    userId: GUEST_ID,
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

                const finalData = {
                    userId,
                    text
                };

                const created = await api.post('/api/greetings', finalData);
                return GreetingSchema.parse(created);
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
            if (!userId || userId === GUEST_ID) {
                const existingJson = await AsyncStorage.getItem(GUEST_GREETINGS_KEY);
                const greetings: Greeting[] = existingJson ? JSON.parse(existingJson) : [];
                return greetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else {
                // --- API (Authenticated) ---
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated.");

                console.log(`[GreetingService] Fetching greetings for userId: ${userId}`);
                const result = await api.get('/api/greetings', {
                    params: { userId }
                });
                return z.array(GreetingSchema).parse(result);
            }
        } catch (error) {
            console.error("Error [getUserGreetings]:", error);
            throw error;
        }
    }
};
