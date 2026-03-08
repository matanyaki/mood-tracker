
import { db } from '../config/firebase';
import greetingService from '../services/greetingService';

async function checkFirebase() {
    console.log("Checking Firestore connection...");

    if (!db) {
        console.error("Firestore DB not initialized!");
        process.exit(1);
    }

    try {
        console.log("1. Listing current collections...");
        const collections = await db.listCollections();
        const collectionIds = collections.map(c => c.id);
        console.log("Found collections:", collectionIds);

        if (collectionIds.includes('greetings')) {
            console.log("✅ 'greetings' collection ALREADY exists.");
        } else {
            console.log("⚠️ 'greetings' collection does NOT exist yet (normal if empty).");
        }

        console.log("\n2. Attempting to create a test greeting...");
        const testUser = "test-backend-user";
        const testText = "This is a test greeting from the backend script.";

        const newGreeting = await greetingService.createGreeting(testUser, testText);
        console.log("✅ Successfully created greeting:", newGreeting);

        console.log("\n3. Verifying collection existence after creation...");
        const updatedCollections = await db.listCollections();
        const updatedIds = updatedCollections.map(c => c.id);

        if (updatedIds.includes('greetings')) {
            console.log("✅ 'greetings' collection NOW exists.");
        } else {
            console.error("❌ 'greetings' collection STILL NOT FOUND (unexpected).");
        }

    } catch (error) {
        console.error("❌ Error during check:", error);
    } finally {
        process.exit(0);
    }
}

checkFirebase();
