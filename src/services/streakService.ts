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

/**
 * Where the last known summary is kept, per user.
 *
 * Keyed by uid on purpose: logout drops the TanStack cache but not AsyncStorage, so
 * a shared key would show the previous account's streak to the next one. A different
 * uid simply misses.
 */
const cacheKey = (userId: string) => `@streak_summary_${userId}`;

export const StreakService = {
    /**
     * The last summary written for this user, or null if there isn't one.
     *
     * TanStack's cache lives in memory, so every cold start begins with nothing and
     * the card would hold a skeleton for a whole round trip — longer if the request
     * times out and gets retried. This is the same trick QuoteCard uses: show what we
     * had, let the real fetch correct it.
     */
    getCachedStreaks: async (userId: string): Promise<StreakSummary | null> => {
        try {
            const raw = await AsyncStorage.getItem(cacheKey(userId));
            if (!raw) return null;

            // safeParse, not parse: a summary written by an older build should be
            // ignored, not thrown — this is an optimisation, never a failure path.
            const parsed = StreakSummarySchema.safeParse(JSON.parse(raw));
            return parsed.success ? parsed.data : null;
        } catch (error) {
            console.log('[StreakService] Could not read cached streaks:', error);
            return null;
        }
    },

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
            const summary = StreakSummarySchema.parse(result);

            // Deliberately not awaited: the caller is waiting on this response, and a
            // slow disk write should not be added to a request the user is watching.
            // A failed write only costs the next cold start its head start.
            AsyncStorage.setItem(cacheKey(userId), JSON.stringify(summary))
                .catch(err => console.log('[StreakService] Could not cache streaks:', err));

            return summary;
        } catch (error) {
            console.error("Error [getStreaks]:", error);
            throw error;
        }
    }
};
