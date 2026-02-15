import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let db: admin.firestore.Firestore | undefined;

try {
    if (!admin.apps.length) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';

        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

        if (fs.existsSync(resolvedPath)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require(resolvedPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log(`Firebase Admin connected to project: ${serviceAccount.project_id}`);
        } else {
            console.error('Service account file not found at:', resolvedPath);
            console.error('Please ensure you have placed your firebase service account json file in the server root.');
        }
    }
    // This will throw if app not initialized
    if (admin.apps.length) {
        db = admin.firestore();
    }
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
}

export { admin, db };
