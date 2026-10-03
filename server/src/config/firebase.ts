import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

let db: admin.firestore.Firestore | undefined;

/**
 * Locate the service account key for Application Default Credentials.
 *
 *   - Deployed: GOOGLE_APPLICATION_CREDENTIALS names a Render Secret File at
 *     /etc/secrets/serviceAccount.json. The key never enters the repo or the build.
 *   - Local dev: when the variable is unset, fall back to FIREBASE_SERVICE_ACCOUNT_PATH
 *     or ./service-account.json (gitignored), which is how `npm run dev` has always
 *     worked. Production never falls back -- it must be told where the key is.
 *
 * The file is checked here because applicationDefault() does not check it: with no
 * usable key it falls back to the GCE metadata server and only fails on the first
 * Firestore call, long after the instance has passed its health check.
 */
const loadCredentials = (): { file: string; projectId: string } => {
    let file = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!file && !isProduction) {
        file = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json');
        process.env.GOOGLE_APPLICATION_CREDENTIALS = file;
    }

    if (!file) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
    }
    if (!fs.existsSync(file)) {
        throw new Error(`GOOGLE_APPLICATION_CREDENTIALS points at ${file}, which does not exist`);
    }

    const key = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (key.type !== 'service_account' || !key.project_id) {
        throw new Error(`${file} is not a service account key`);
    }

    return { file, projectId: key.project_id };
};

try {
    const { file, projectId } = loadCredentials();

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId,
        });
    }
    db = admin.firestore();
    console.log(`Firebase Admin connected to project: ${projectId} (key: ${file})`);
} catch (error) {
    // Booting without Firebase means answering every authenticated request with 401,
    // so production refuses to start. Dev keeps going so unrelated routes still work.
    if (isProduction) {
        throw new Error(`Firebase Admin not initialized: ${(error as Error).message}`);
    }
    console.error('Failed to initialize Firebase:', (error as Error).message);
}

export { admin, db };
