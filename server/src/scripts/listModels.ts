
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY; // Using non-null assertion for script speed
if (!apiKey) {
    console.error("No API KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
    console.log("Listing models...");
    try {
        // The listModels method might need a different setup or isn't on the main client directly in older versions, 
        // but let's try the model manager if available, or just use the raw API via fetch if the SDK is obscure.
        // Actually, in the new SDK:
        // There isn't a direct `listModels` on `genAI`. 
        // We might have to use the REST API manually to check.
        // But wait, the error message SAID "Call ListModels to see...".
        // This implies the API supports it.
        // The SDK might not expose it easily.

        // Let's try to fetch it manually.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

list();
