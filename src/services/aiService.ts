// src/services/aiService.ts
import { API_BASE_URL } from '../config/api';
import { JournalEntry } from "../models/JournalEntry";

export const AIService = {

    /**
     * Scenario 1: Instant Feedback
     * Triggered immediately after the user saves a Check-In.
     * Goal: Validate their feelings and offer 1 small tip.
     */
    generateInstantFeedback: async (entry: Partial<JournalEntry>): Promise<string> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/reflect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': ...
                    'x-mock-user-id': entry.userId || 'test-user-id'
                },
                body: JSON.stringify({
                    emotion: entry.emotion,
                    scale: entry.scale,
                    note: entry.note
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
