
import { useState } from 'react';
import { GreetingService } from '../services/greetingService';
import { GUEST_ID } from '../services/journalService';
import { useAuth } from '../context/AuthContext';

export const useGreetingController = () => {
    const { user, isGuest } = useAuth();
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
