import { API_BASE_URL } from "../config/api";
import type { JournalEntry } from '@shared/types';
import { auth } from '../config/firebase'; // Added auth import

export const AIService = {

    /**
     * Scenario 1: Instant Feedback
     * Triggered immediately after the user saves a Check-In.
     * Goal: Validate their feelings and offer 1 small tip.
     */
    generateInstantFeedback: async (entry: Partial<JournalEntry>): Promise<string> => {
        try {
            // Get current user's token
            const user = auth.currentUser;
            if (!user) {
                console.warn("No authenticated user, skipping AI feedback generation");
                return "I hear you. Take a moment to breathe deeply.";
            }

            const token = await user.getIdToken();

            const response = await fetch(`${API_BASE_URL}/api/ai/reflect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    emotions: entry.emotions,
                    userId: entry.userId,
                    date: entry.date,
                    timestamp: entry.timestamp
                })
            });

            if (!response.ok) {
                // return fallback silently or throw
                console.warn("AI Reflection failed", response.status);
                return "I hear you. Take a moment to breathe deeply. Your feelings are valid.";
            }

            const data = await response.json();
            // Backend returns { success: true, data: { reflection: string, detectedEmotions: string[] } }
            if (data.success && data.data) {
                return data.data.reflection;
            }

            return "I hear you. Take a moment to breathe deeply.";

        } catch (error) {
            console.error("AI Error [Instant Feedback]:", error);
            // Fallback message so the app doesn't crash
            return "I hear you. Take a moment to breathe deeply. Your feelings are valid.";
        }
    },

    /**
     * Scenario 2: Weekly/Monthly Insights
     * Triggered on the Insights screen.
     * Goal: Find patterns in their history.
     */
    generateInsights: async (entries: JournalEntry[]): Promise<{ summary: string; advice: string }> => {
        // TODO: Implement /api/ai/insights endpoint in backend
        console.warn("generateInsights not yet implemented in backend");
        return {
            summary: "Insights are coming soon!",
            advice: "Keep journaling to unlock patterns in the future."
        };
    }
};
