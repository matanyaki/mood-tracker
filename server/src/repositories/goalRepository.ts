import { db } from '../config/firebase';
import { firestore } from 'firebase-admin';
import { BaseRepository } from './baseRepository';
import type { Goal, CreateGoalDTO, GoalCompletion, GoalCompletionsByGoal } from '../../../shared/types';

// What the repository actually writes: the caller's DTO plus the endDate the
// service derived from it. Kept out of the shared DTO on purpose — endDate is
// never something a client sends.
type GoalWriteData = CreateGoalDTO & { endDate: string };

class GoalRepository extends BaseRepository<Goal, GoalWriteData, GoalWriteData> {

    protected getCollection(userId: string): FirebaseFirestore.CollectionReference {
        if (!db) throw new Error('Firestore is not initialized.');
        return db.collection('users').doc(userId).collection('goals');
    }

    /** users/{uid}/goals/{goalId}/completions — one document per day done. */
    private getCompletionsCollection(userId: string, goalId: string): FirebaseFirestore.CollectionReference {
        return this.getCollection(userId).doc(goalId).collection('completions');
    }

    async findAll(userId: string): Promise<Goal[]> {
        if (!db) throw new Error('Firestore is not initialized.');

        const snapshot = await this.getCollection(userId)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = data.createdAt;
            let updatedAt = data.updatedAt;

            if (createdAt && typeof createdAt.toDate === 'function') {
                createdAt = createdAt.toDate();
            }
            if (updatedAt && typeof updatedAt.toDate === 'function') {
                updatedAt = updatedAt.toDate();
            }

            return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt
            } as Goal;
        });
    }

    /**
     * Every day marked done, across all of the user's goals.
     *
     * The date IS the completion's document id, so the ids are the whole answer and
     * no document body is ever needed — `.select()` with no fields asks Firestore
     * for exactly that. One subcollection read per goal: a collectionGroup query
     * would be a single round trip, but completions carry no userId field to scope
     * one by, and adding it would duplicate what the document path already says.
     *
     * Goals with nothing marked are still returned, as an empty list, so the caller
     * can tell "never marked" apart from "not a goal of yours".
     */
    async findAllCompletions(userId: string): Promise<GoalCompletionsByGoal> {
        if (!db) throw new Error('Firestore is not initialized.');

        const goals = await this.getCollection(userId).select().get();

        const entries = await Promise.all(goals.docs.map(async goal => {
            const completions = await this.getCompletionsCollection(userId, goal.id).select().get();
            return [goal.id, completions.docs.map(doc => doc.id)] as [string, string[]];
        }));

        return Object.fromEntries(entries);
    }

    /**
     * Delete a goal and the completions underneath it.
     *
     * Firestore does not cascade: deleting the goal document on its own would leave
     * its completions subcollection alive and unreachable, and a new goal that ever
     * reused the id would inherit them. The base delete still runs first so a
     * missing goal is still a 404 rather than a silent success.
     */
    async delete(userId: string, goalId: string): Promise<void> {
        await super.delete(userId, goalId);

        const completions = await this.getCompletionsCollection(userId, goalId).get();
        await Promise.all(completions.docs.map(doc => doc.ref.delete()));
    }

    /**
     * Mark one day done.
     *
     * The date IS the document id, so a second tap on the same day lands on the
     * same document rather than adding a row. An existing completion is returned
     * untouched — completions are write-once, so re-writing one would only move
     * its `completedAt` off the moment it actually happened.
     */
    async markDone(userId: string, goalId: string, date: string): Promise<GoalCompletion> {
        if (!db) throw new Error('Firestore is not initialized.');

        const docRef = this.getCompletionsCollection(userId, goalId).doc(date);
        const existing = await docRef.get();

        if (!existing.exists) {
            await docRef.set({
                done: true,
                completedAt: firestore.FieldValue.serverTimestamp()
            });
        }

        const doc = await docRef.get();
        const data = doc.data()!;
        let completedAt = data.completedAt;

        if (completedAt && typeof completedAt.toDate === 'function') {
            completedAt = completedAt.toDate();
        }

        return {
            id: doc.id,
            done: true,
            completedAt
        } as GoalCompletion;
    }
}

export const goalRepository = new GoalRepository();
