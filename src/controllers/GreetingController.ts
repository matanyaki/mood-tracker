
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GreetingService } from '../services/greetingService';
import { GUEST_ID } from '../constants/variables';
import { useAuth } from '../context/AuthContext';

export const useGreetingController = () => {
    const { user, isGuest } = useAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveGreeting = async (text: string) => {
        if (!text.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const userId = isGuest || !user ? GUEST_ID : user.uid;
            console.log(`[GreetingController] Saving greeting for UserID: ${userId} (Guest Mode: ${isGuest})`);
            await GreetingService.addGreeting(userId, text);
            console.log("Greeting saved for user:", userId);

            // Both of these read the greeting that was just written: ['greetings']
            // is what dots the Diary calendar, ['streaks'] is what the StreakCard on
            // the screen behind this modal shows. Neither was invalidated before, so
            // a new greeting stayed invisible until its cache entry went stale.
            queryClient.invalidateQueries({ queryKey: ['greetings'] });
            queryClient.invalidateQueries({ queryKey: ['streaks'] });
        } catch (err: any) {
            console.error("Failed to save greeting:", err);
            setError(err.message || "Could not save your note.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        saveGreeting,
        isLoading,
        error
    };
};
