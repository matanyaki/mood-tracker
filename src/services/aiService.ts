// src/services/aiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";
import { JournalEntry } from "../models/JournalEntry";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export const AIService = {

    /**
     * Scenario 1: Instant Feedback
     * Triggered immediately after the user saves a Check-In.
     * Goal: Validate their feelings and offer 1 small tip.
     */
    generateInstantFeedback: async (entry: Partial<JournalEntry>): Promise<string> => {
        try {
            const emotionsList = entry.emotions?.map(e => `${e.name} (${e.note || ''})`).join(', ');

            const prompt = `
        You are a supportive, empathetic, and clinically-informed mental health companion, designed for a calm, reassuring user experience.

The user has checked in with the following emotional state:

Primary Emotion: ${entry.primaryEmotion}

Specific Feelings: ${emotionsList}

Your tasks:

Gently validate the user’s emotional experience in one clear sentence, showing understanding without judgment or assumptions.

Offer one simple, immediately actionable micro-habit or cognitive reframe that feels achievable and supportive in the moment.

UX & Content Guidelines:

Keep the response human, warm, and grounded (not clinical or robotic)

Avoid clichés, platitudes, or toxic positivity

Do not overwhelm the user — less is more

Write in natural, comforting language suitable for a wellbeing app

Constraints:

Maximum 3 sentences total

No questions

No advice that requires preparation, tools, or long effort

The response should leave the user feeling seen, calmer, and gently supported.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

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
        try {
            if (entries.length < 3) {
                return {
                    summary: "Keep journaling! I need a few more entries to spot patterns.",
                    advice: "Consistency is key to understanding your emotional landscape."
                };
            }

            // We format the history into a readable string for the AI
            const historyText = entries.map(e =>
                `- ${e.date}: Felt ${e.primaryEmotion} (${e.emotions.map(x => x.name).join(', ')})`
            ).join('\n');

            const prompt = `
        You are an emotionally intelligent wellbeing analyst, designed to surface gentle, supportive insights from personal journal data while respecting emotional nuance.

Input — Journal History:
${historyText}

Your tasks:

Identify one clear emotional pattern or trend across the entries (frequency, timing, repetition, or emotional shifts).

Keep it observational, not diagnostic

Use tentative language (e.g., “often,” “tends to,” “may be”)

Provide one personalized, practical suggestion that aligns naturally with this pattern and feels realistic to apply.

UX & Content Guidelines:

Be concise, calm, and non-judgmental

Avoid absolute claims or labels

Do not moralize emotions (no “should” or “must”)

The output should feel safe, reflective, and encouraging

Output Format (STRICT):

{
  "summary": "One gentle, user-friendly sentence describing the observed emotional trend.",
  "advice": "One supportive, actionable sentence tailored to that trend."
}


Constraints:

Return ONLY valid JSON

No extra text, comments, or formatting

Each value must be a single sentence

The result should be suitable for a wellbeing app insight card that helps the user feel understood rather than analyzed.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up JSON (Gemini sometimes adds ```json blocks)
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);

        } catch (error) {
            console.error("AI Error [Insights]:", error);
            return {
                summary: "Unable to analyze trends right now.",
                advice: "Check back later when you have more entries."
            };
        }
    }
};