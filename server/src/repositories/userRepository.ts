import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import { AppError } from '../middleware/errorHandler';
import type { UserProfile, CreateUserProfileDTO, UpdateUserProfileDTO } from '../../../shared/types';

class UserRepository {
    private docRef(userId: string): FirebaseFirestore.DocumentReference {
        if (!db) throw new Error('Firestore is not initialized.');
        return db.collection('users').doc(userId);
    }

    /**
     * Idempotently ensure a profile exists, returning the existing one untouched if
     * it does. Runs in a transaction: a plain get-then-set lets two concurrent syncs
     * both observe "missing" and the second one clobber the first's stats.
     */
    async create(data: CreateUserProfileDTO): Promise<UserProfile> {
        if (!db) throw new Error('Firestore is not initialized.');

        const userRef = this.docRef(data.uid);

        return db.runTransaction(async (tx) => {
            const snap = await tx.get(userRef);

            if (snap.exists) {
                return snap.data() as UserProfile;
            }

            const newProfile: UserProfile = {
                uid: data.uid,
                email: data.email || '',
                createdAt: new Date().toISOString(),
                preferences: { theme: 'system', notificationsEnabled: false },
                stats: { totalEntries: 0, currentStreak: 0 }
            };

            tx.set(userRef, newProfile);
            return newProfile;
        });
    }

    async findById(userId: string): Promise<UserProfile | null> {
        const snap = await this.docRef(userId).get();

        if (!snap.exists) {
            return null;
        }

        return snap.data() as UserProfile;
    }

    async update(userId: string, data: UpdateUserProfileDTO): Promise<void> {
        try {
            await this.docRef(userId).update(data);
        } catch (error: unknown) {
            throw this.asNotFound(error, 'User not found.');
        }
    }

    /**
     * Atomically bump the entry counter and stamp today's check-in.
     *
     * Dotted field paths update the nested keys in place, so sibling stats such as
     * currentStreak are preserved. FieldValue.increment is applied server-side,
     * which makes concurrent entry creations additive instead of last-write-wins.
     */
    async incrementEntryStats(userId: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        try {
            await this.docRef(userId).update({
                'stats.totalEntries': firestore.FieldValue.increment(1),
                'stats.lastCheckInDate': today
            });
        } catch (error: unknown) {
            throw this.asNotFound(error, 'User profile not found.');
        }
    }

    /**
     * Firestore rejects an update on a missing document with gRPC code 5 (NOT_FOUND).
     * Translate that into a 404 rather than letting it surface as an opaque 500.
     */
    private asNotFound(error: unknown, message: string): unknown {
        if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 5) {
            return new AppError(message, 404);
        }
        return error;
    }
}

export const userRepository = new UserRepository();
