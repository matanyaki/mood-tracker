/**
 * Streak maths.
 *
 * Shared rather than backend-only because the guest path needs the exact same
 * answer: guest data never reaches the server, so StreakService counts it on the
 * device with these functions instead of calling /api/streaks.
 *
 * Everything here works on 'YYYY-MM-DD' day keys, never on Date objects, so the
 * timezone question is answered once — in dayKeyFromMillis — and the counting
 * below cannot reintroduce it.
 */

/**
 * Convert an instant to the caller's local calendar day.
 *
 * `tzOffsetMinutes` is exactly what `Date.prototype.getTimezoneOffset()` returns:
 * minutes BEHIND UTC, so UTC+3 reports -180. Local time is therefore UTC minus the
 * offset — shift the instant by that much and read the UTC fields, which gives the
 * local day without ever asking the host what timezone it is in. That matters on
 * the server, where the host timezone is not the user's.
 */
export function dayKeyFromMillis(ms: number, tzOffsetMinutes: number): string {
    const shifted = new Date(ms - tzOffsetMinutes * 60 * 1000);
    return shifted.toISOString().slice(0, 10);
}

/**
 * The day before a day key.
 *
 * Parsed as UTC midnight and stepped in UTC on purpose: the key already IS a local
 * calendar day, so stepping it in local time would apply the timezone twice and
 * lose or repeat a day across a DST boundary.
 */
function previousDay(dayKey: string): string {
    const date = new Date(`${dayKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

/** The most recent of a set of day keys, or null when there are none. */
export function latestDayKey(dayKeys: string[]): string | null {
    if (dayKeys.length === 0) return null;
    // 'YYYY-MM-DD' is fixed-width and zero-padded, so lexical order IS date order.
    return dayKeys.reduce((latest, day) => (day > latest ? day : latest));
}

/**
 * Count consecutive days ending at `today` (or at yesterday).
 *
 * The grace rule is the whole point: a user who logged yesterday but has not got
 * to it yet today is on a live streak, not a broken one — today is pending. Only a
 * most-recent day older than yesterday counts as broken.
 *
 * @param dayKeys Every day that has an entry. Unsorted and duplicated is fine —
 *                several entries on one day are one day.
 * @param today   The user's local day key, from dayKeyFromMillis.
 */
export function computeStreak(dayKeys: string[], today: string): number {
    // Days after today are dropped rather than counted: a device clock running fast
    // would otherwise put the most recent day in the future, which is neither today
    // nor yesterday, and would silently report a live streak as broken.
    const days = Array.from(new Set(dayKeys))
        .filter(day => day <= today)
        .sort()
        .reverse();

    if (days.length === 0) return 0;

    const mostRecent = days[0];
    if (mostRecent !== today && mostRecent !== previousDay(today)) {
        return 0;
    }

    let streak = 1;
    let expected = previousDay(mostRecent);

    for (let i = 1; i < days.length; i++) {
        if (days[i] !== expected) break;
        streak++;
        expected = previousDay(expected);
    }

    return streak;
}
