// types/env.d.ts
declare module '@env' {
    export const FIREBASE_API_KEY: string;
    export const FIREBASE_AUTH_DOMAIN: string;
    export const FIREBASE_PROJECT_ID: string;
    export const FIREBASE_STORAGE_BUCKET: string;
    export const FIREBASE_MESSAGING_SENDER_ID: string;
    export const FIREBASE_APP_ID: string;
    /** LAN IP of the dev machine running the backend. Local development only. */
    export const API_HOST: string;
    /** Full origin of a deployed backend, e.g. https://mood-tracker-api.onrender.com.
     *  Takes priority over API_HOST when set. */
    export const API_URL: string;
}
