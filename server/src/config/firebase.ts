import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let db: admin.firestore.Firestore | undefined;

/**
 * Resolve the service account key.
 *
 * Two sources, in priority order:
 *
 *   1. FIREBASE_SERVICE_ACCOUNT -- the whole key as one JSON string. This is how a
 *      deployed instance is configured: service-account.json is gitignored and
 *      never reaches the build, so on Render there is no file to point at.
 *   2. A file on disk, which is how local development has always worked.
 *
 * The env var wins so a deployed instance can never silently fall back to a stale
 * key that happened to be left in the image.
 */
const loadServiceAccount = (): admin.ServiceAccount | null => {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (inline) {
        console.log('Firebase Admin: using FIREBASE_SERVICE_ACCOUNT');
        return JSON.parse(inline);
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(resolvedPath);
    }

    console.error('Service account file not found at:', resolvedPath);
    console.error('Place your firebase service account json in the server root, or set');
    console.error('FIREBASE_SERVICE_ACCOUNT to the key JSON (how the deployed instance is configured).');
    return null;
};

try {
    if (!admin.apps.length) {
        const serviceAccount = loadServiceAccount();

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log(`Firebase Admin connected to project: ${(serviceAccount as { project_id?: string }).project_id}`);
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
