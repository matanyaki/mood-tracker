import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';

class UserService {
    async syncUser(user: any) {
        if (!db) throw new Error('Firestore is not initialized.');
        try {
            const userRef = db.collection('users').doc(user.uid);
            const userSnap = await userRef.get();

            if (!userSnap.exists) {
                const newProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    createdAt: new Date().toISOString(),
                    preferences: { theme: 'system', notificationsEnabled: false },
                    stats: { totalEntries: 0, currentStreak: 0 }
                };
                await userRef.set(newProfile);
            }
        } catch (error: any) {
            console.error("Error syncing user profile:", error);
            throw error;
        }
    }

    async incrementEntryCount(userId: string) {
        if (!db) throw new Error('Firestore is not initialized.');
        try {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
                "stats.totalEntries": firestore.FieldValue.increment(1),
                "stats.lastCheckInDate": new Date().toISOString().split('T')[0]
            });
        } catch (error: any) {
            console.error("Error incrementing entry count:", error);
            throw error;
        }
    }

    async getProfile(userId: string) {
        if (!db) throw new Error('Firestore is not initialized.');
        try {
            const snap = await db.collection('users').doc(userId).get();
            return snap.exists ? snap.data() : null;
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            throw error;
        }
    }
}

export default new UserService();
