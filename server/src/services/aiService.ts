import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import dotenv from 'dotenv';
import { JournalEntry } from './journalService';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Configure the Gemini model.
 * Using gemini-1.5-flash for speed and efficiency, with structured JSON output enforced.
 */
const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: "You are a supportive, empathetic, and insightful Mood Tracker assistant. Your goal is to analyse the user's journal entry and mood to provide a thoughtful reflection. Help users identify patterns and offer gentle, actionable advice. Avoid being overly clinical or judgmental.",
});

interface ReflectionResponse {
    reflection: string;
    detectedEmotions: string[];
}


interface ReflectionResponse {
    reflection: string;
    detectedEmotions: string[];
}

export const generateReflection = async (entry: Partial<JournalEntry>): Promise<ReflectionResponse> => {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    try {
        const schema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                reflection: {
                    type: SchemaType.STRING,
                    description: "A supportive and insightful reflection on the user's journal entry."
                },
                detectedEmotions: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "A list of emotions detected in the entry."
                }
            },
            required: ["reflection", "detectedEmotions"]
        };


        const prompt = `
        User's Emotion: ${entry.emotion || "Not specified"} (Intensity: ${entry.scale || 1}/5)
        Note: "${entry.note || "No details provided"}"

        Analyze this single emotion entry and provide a supportive reflection.
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const responseText = result.response.text();
        const parsedResponse = JSON.parse(responseText) as ReflectionResponse;

        return parsedResponse;

    } catch (error: any) {
        console.error("Error generating reflection:", error);
        // Rethrow the original error message for better debugging during development
        throw new Error(`Failed to generate AI reflection: ${error.message}`);
    }
};

export default {
    generateReflection
};
