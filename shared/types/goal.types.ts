import { z } from 'zod';

/**
 * The four slots a goal can be scheduled in. Ordered through the day, because the
 * form draws them in this order and a set of times reads as a sequence.
 */
export const TIMES_OF_DAY = ['morning', 'noon', 'afternoon', 'night'] as const;

export type TimeOfDay = typeof TIMES_OF_DAY[number];

export const TimeOfDaySchema = z.enum(TIMES_OF_DAY);

export const GoalSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    name: z.string().trim().min(1),
    startDate: z.string(), // YYYY-MM-DD, chosen by the user
    months: z.number().int().positive(),
    endDate: z.string(),   // YYYY-MM-DD, always computeEndDate(startDate, months)
    timesPerWeek: z.number().int().positive(),
    // 0 = Sunday, matching Date.prototype.getDay()
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    timesOfDay: z.array(TimeOfDaySchema).min(1),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

// endDate is derived, never sent: the server computes it from startDate + months so
// the two can't disagree. userId comes from the verified token, the same way it does
// for an entry or a greeting.
export type CreateGoalDTO = Omit<Goal, 'id' | 'userId' | 'endDate' | 'createdAt' | 'updatedAt'>;
export type UpdateGoalDTO = CreateGoalDTO;

/**
 * One day marked done, stored at users/{uid}/goals/{goalId}/completions/{YYYY-MM-DD}.
 *
 * The document's EXISTENCE is the fact — `done` is always true and nothing here is
 * ever edited or deleted, so there is no "undone" state to represent. The date is
 * the document id rather than a field, which is what makes a second tap on the same
 * day a no-op instead of a duplicate row.
 */
export const GoalCompletionSchema = z.object({
    id: z.string().optional(), // the 'YYYY-MM-DD' document id
    done: z.literal(true),
    completedAt: z.any().optional(),
});

export type GoalCompletion = z.infer<typeof GoalCompletionSchema>;

/**
 * Every day marked done, as goalId -> ['YYYY-MM-DD', ...].
 *
 * Completions are stored one document per day, named after the date, so a whole
 * goal's history is just the list of its document ids — there is nothing else in
 * those documents the UI reads. Sent in this shape so the Diary can ask once for
 * every goal instead of once per goal.
 */
export type GoalCompletionsByGoal = Record<string, string[]>;

/**
 * One goal's progress over its full run, startDate to endDate. `GET /api/goals/progress`
 * returns one of these per goal.
 *
 * Nothing here is stored — it is derived from the goal and its completions on every
 * request, the same way /api/streaks is.
 *
 * `target` is every day the goal is scheduled on across that run. A valid goal picks
 * at least one weekday and runs at least a month, so it is never zero in practice.
 */
export const GoalProgressSchema = z.object({
    goalId: z.string(),
    name: z.string(),
    completed: z.number().int().min(0),
    target: z.number().int().min(0),
    percent: z.number().int().min(0).max(100), // round(completed / target * 100), clamped
});

export type GoalProgress = z.infer<typeof GoalProgressSchema>;

/** A 'YYYY-MM-DD' key, the format both startDate and a completion id use. */
export const GOAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const GoalDateSchema = z.string().regex(GOAL_DATE_PATTERN, 'Expected a YYYY-MM-DD date.');

/**
 * The one and only endDate rule: startDate plus `months` calendar months.
 *
 * Built from the date parts rather than `new Date(...)` arithmetic so it stays on
 * the calendar the user picked from — a Date would drag the caller's timezone into
 * a value that has no time of day at all.
 *
 * A short month clamps: 31 Jan + 1 month is 28 (or 29) Feb, not 3 March.
 */
/**
 * Whether a goal is scheduled on one 'YYYY-MM-DD' day.
 *
 * A goal stores a window and a set of weekdays, never a list of dates, so the days
 * it falls on are derived — this is the one place that derives them, and the Diary
 * calendar and the day sheet both read it rather than each deciding for themselves.
 *
 * Both ends of the window count: a goal that runs three months from the 14th is
 * still running on its end date.
 *
 * The range test is a string comparison because 'YYYY-MM-DD' sorts lexically, and
 * the weekday is read off a LOCAL Date built from the parts. `new Date('2026-09-14')`
 * would parse as UTC midnight, which is the previous day — and so the previous
 * weekday — anywhere west of Greenwich.
 */
export function isGoalScheduledOn(
    goal: Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek'>,
    date: string
): boolean {
    if (date < goal.startDate || date > goal.endDate) return false;

    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(year, month - 1, day).getDay();

    return goal.daysOfWeek.includes(weekday);
}

/** What a scheduled goal-day looks like once the date and the completions are known. */
export type GoalDayStatus = 'done' | 'missed' | 'pending' | 'upcoming';

/**
 * The status of ONE scheduled day of a goal. Only call it for a day the goal is
 * actually scheduled on — isGoalScheduledOn answers that, and this answers what
 * became of it.
 *
 * Read in date order rather than completion order: a day that hasn't arrived yet is
 * 'upcoming' whatever is stored against it, so a completion written ahead of time
 * can't make a future day claim to be done. Everything up to and including today is
 * 'done' if it was marked, and otherwise splits on whether there is still time —
 * today is 'pending', a past day is 'missed'.
 *
 * Both dates are 'YYYY-MM-DD', which compares correctly as a string.
 */
export function goalDayStatus(date: string, today: string, isCompleted: boolean): GoalDayStatus {
    if (date > today) return 'upcoming';
    if (isCompleted) return 'done';
    return date === today ? 'pending' : 'missed';
}

export function computeEndDate(startDate: string, months: number): string {
    const [year, month, day] = startDate.split('-').map(Number);

    const totalMonths = (month - 1) + months;
    const endYear = year + Math.floor(totalMonths / 12);
    const endMonth = (totalMonths % 12) + 1;

    // Day 0 of the following month is the last day of this one.
    const daysInEndMonth = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
    const endDay = Math.min(day, daysInEndMonth);

    return `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}
