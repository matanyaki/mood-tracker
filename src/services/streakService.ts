// src/services/streakService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StreakSummary, JournalEntry, Greeting } from '@shared/types';
import { StreakSummarySchema } from '../../shared/types';
import { computeStreak, dayKeyFromMillis, latestDayKey } from '../../shared/utils/streak';
import api from '../config/api';
import { auth } from '../config/firebase';
import { GUEST_ID, GUEST_STORAGE_KEY, GUEST_GREETINGS_KEY } from '../constants/variables';

/**
 * Count a guest's streaks on the device.
 *
 * Guest data never reaches the backend, so there is no /api/streaks answer for it.
 * Reading the two AsyncStorage keys directly rather than going through
 * JournalService.getUserEntries is deliberate: that method's unscoped branch only
 * returns the last 30 days, which would silently cap a guest's streak at 30.
 *
 * The maths is the shared computeStreak the server uses, so a guest who signs up
 * does not see their streak change meaning.
 */
const getGuestStreaks = async (tzOffsetMinutes: number): Promise<StreakSummary> => {
    const [entriesJson, greetingsJson] = await Promise.all([
        AsyncStorage.getItem(GUEST_STORAGE_KEY),
        AsyncStorage.getItem(GUEST_GREETINGS_KEY),
    ]);

    const entries: JournalEntry[] = entriesJson ? JSON.parse(entriesJson) : [];
    const greetings: Greeting[] = greetingsJson ? JSON.parse(greetingsJson) : [];

    const emotionDays = entries
        .map(entry => entry.timestamp)
        .filter(ms => Number.isFinite(ms))
        .map(ms => dayKeyFromMillis(ms, tzOffsetMinutes));

    // A guest greeting stores createdAt as an ISO string, not a Firestore Timestamp.
    const greetingDays = greetings
        .map(greeting => new Date(greeting.createdAt).getTime())
        .filter(ms => Number.isFinite(ms))
        .map(ms => dayKeyFromMillis(ms, tzOffsetMinutes));

    const today = dayKeyFromMillis(Date.now(), tzOffsetMinutes);

    return {
        emotionStreak: computeStreak(emotionDays, today),
        greetingStreak: computeStreak(greetingDays, today),
        lastEmotionDay: latestDayKey(emotionDays),
        lastGreetingDay: latestDayKey(greetingDays),
    };
};

export const StreakService = {
    /**
     * Both daily streaks.
     * - Authenticated: GET /api/streaks — the server counts, the client displays.
     * - Guest: counted locally, because guest data never reaches the backend at all.
     *
     * The device's UTC offset goes with the request because the server cannot infer
     * it, and a streak is a question about the USER's calendar days.
     */
    getStreaks: async (userId: string): Promise<StreakSummary> => {
        const tzOffsetMinutes = new Date().getTimezoneOffset();

        try {
            if (userId === GUEST_ID) {
                return await getGuestStreaks(tzOffsetMinutes);
            }

            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated.");

            console.log(`[StreakService] Fetching streaks (tzOffsetMinutes: ${tzOffsetMinutes})`);
            const result = await api.get('/api/streaks', { params: { tzOffsetMinutes } });
            return StreakSummarySchema.parse(result);
        } catch (error) {
            console.error("Error [getStreaks]:", error);
            throw error;
        }
    }
};
