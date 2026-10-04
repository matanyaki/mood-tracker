import { z } from 'zod';

/**
 * The four slots a goal can be scheduled in. Ordered through the day, because the
 * form draws them in this order and a set of times reads as a sequence.
 */
export const TIMES_OF_DAY = ['morning', 'noon', 'afternoon', 'night'] as const;

export type TimeOfDay = typeof TIMES_OF_DAY[number];

export const TimeOfDaySchema = z.enum(TIMES_OF_DAY);

/**
 * One pause in a goal's run. The days strictly between `lastDay` and `resumedOn` are
 * not part of the goal at all -- neither done nor missed -- and the run is pushed
 * out by however many goal days fell inside them.
 */
export const GoalPauseSchema = z.object({
    lastDay: z.string(),              // YYYY-MM-DD, the last day the goal ran before it
    resumedOn: z.string().optional(), // YYYY-MM-DD, the first day it runs again; absent while paused
});

export type GoalPause = z.infer<typeof GoalPauseSchema>;

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
    // Oldest first; only the last one can still be open. Absent on a goal never
    // paused. Written only by the pause and resume actions, never by create or edit.
    pauses: z.array(GoalPauseSchema).optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

// endDate is derived, never sent: the server computes it from startDate + months so
// the two can't disagree. userId comes from the verified token, the same way it does
// for an entry or a greeting. pauses have their own actions (POST /:id/pause, /:id/resume).
export type CreateGoalDTO = Omit<Goal, 'id' | 'userId' | 'endDate' | 'pauses' | 'createdAt' | 'updatedAt'>;
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
 * One goal's progress over its full run. `GET /api/goals/progress` returns one of
 * these per goal.
 *
 * Nothing here is stored — it is derived from the goal and its completions on every
 * request, the same way /api/streaks is.
 *
 * `target` is every day the goal was planned for, startDate to endDate. Pausing does
 * not change it -- the run is pushed out instead. A valid goal picks at least one
 * weekday and runs at least a month, so it is never zero in practice.
 */
export const GoalProgressSchema = z.object({
    goalId: z.string(),
    name: z.string(),
    completed: z.number().int().min(0),
    target: z.number().int().min(0),
    percent: z.number().int().min(0).max(100), // round(completed / target * 100), clamped
    // The goal is paused right now. Optional so a client still parses an answer
    // from a server that predates pausing.
    paused: z.boolean().optional(),
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
 * still running on its last day. A day inside a pause is not scheduled at all.
 *
 * The range test is a string comparison because 'YYYY-MM-DD' sorts lexically, and
 * the weekday is read off a LOCAL Date built from the parts. `new Date('2026-09-14')`
 * would parse as UTC midnight, which is the previous day — and so the previous
 * weekday — anywhere west of Greenwich.
 */
export function isGoalScheduledOn(goal: GoalSchedule, date: string): boolean {
    if (date < goal.startDate || date > goalLastDay(goal)) return false;
    return isOnGoalWeekday(goal, date) && !isInPause(goal, date);
}

/** The fields that decide which days a goal falls on. */
type GoalSchedule = Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek' | 'pauses'>;

/** Whether a day is one of the goal's weekdays, ignoring its window and pauses. */
function isOnGoalWeekday(goal: Pick<Goal, 'daysOfWeek'>, date: string): boolean {
    const [year, month, day] = date.split('-').map(Number);
    return goal.daysOfWeek.includes(new Date(year, month - 1, day).getDay());
}

/** A 'YYYY-MM-DD' moved by whole days. Stepped in UTC so the key stays a plain calendar day. */
function addDays(date: string, days: number): string {
    const cursor = new Date(`${date}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() + days);
    return cursor.toISOString().slice(0, 10);
}

export const nextDay = (date: string) => addDays(date, 1);
export const previousDay = (date: string) => addDays(date, -1);

/** The pause the goal is in right now, if it is paused. Only the last pause can be open. */
export function currentPause(goal: Pick<Goal, 'pauses'>): GoalPause | undefined {
    const last = goal.pauses?.[goal.pauses.length - 1];
    return last && !last.resumedOn ? last : undefined;
}

export const isGoalPaused = (goal: Pick<Goal, 'pauses'>) => !!currentPause(goal);

/** Whether a day falls inside a pause: after its last day, and before it resumed (if it has). */
function isInPause(goal: Pick<Goal, 'pauses'>, date: string): boolean {
    return (goal.pauses ?? []).some(pause =>
        date > pause.lastDay && (!pause.resumedOn || date < pause.resumedOn)
    );
}

/**
 * How many days the goal was planned for: its weekdays from startDate to endDate.
 *
 * Pauses do not change this number -- they change when the run ends. It is the
 * progress ring's target, and what a resumed goal keeps running until it has had.
 */
export function plannedDayCount(goal: Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek'>): number {
    let count = 0;
    for (let day = goal.startDate; day <= goal.endDate; day = nextDay(day)) {
        if (isOnGoalWeekday(goal, day)) count++;
    }
    return count;
}

/**
 * Memo for goalLastDay, which walks the whole run for a goal that has been paused.
 * The Diary asks once per goal per day on screen, and the walk only depends on the
 * goal object -- goals are replaced, never mutated, so the object is a safe key.
 */
const lastDayCache = new WeakMap<object, string>();

/**
 * The last day a goal runs.
 *
 * - Never paused: its end date.
 * - Paused now: the last day it ran. Nothing after it is scheduled until it resumes.
 * - Paused and resumed: the run picks up where it left off. It keeps going until it
 *   has had as many goal days as it was planned for, so the end moves out by the goal
 *   days that fell inside its pauses. Never earlier than the original end date.
 *
 * Everything that asks "is this day part of the goal" goes through here.
 */
export function goalLastDay(goal: GoalSchedule): string {
    const pause = currentPause(goal);
    if (pause) return pause.lastDay;
    if (!goal.pauses?.length) return goal.endDate;

    const cached = lastDayCache.get(goal);
    if (cached) return cached;

    const target = plannedDayCount(goal);
    let lastDay = goal.endDate;

    if (target > 0) {
        let day = goal.startDate;
        let count = 0;
        // Terminates: no pause is open, so every day past the last resume runs, and
        // a goal with a target has at least one weekday.
        while (true) {
            if (isOnGoalWeekday(goal, day) && !isInPause(goal, day)) count++;
            if (count === target) break;
            day = nextDay(day);
        }
        if (day > lastDay) lastDay = day;
    }

    lastDayCache.set(goal, lastDay);
    return lastDay;
}

/**
 * The day a goal paused right now should run through.
 *
 * Today is kept only if it was already marked done: it is then a kept day like any
 * other. Otherwise the goal runs through yesterday, so pausing never leaves a
 * "missed" against today for a day the user just decided not to do.
 */
export function pauseLastDay(today: string, doneToday: boolean): string {
    return doneToday ? today : previousDay(today);
}

/**
 * The day a goal resumed right now runs again from: today, unless today was already
 * kept before the pause -- then tomorrow, so today is not counted twice.
 */
export function resumeDay(today: string, lastDay: string): string {
    return today > lastDay ? today : nextDay(lastDay);
}

/** The goal's pauses after a change, or why the change is not allowed. */
export type PauseChange = { pauses: GoalPause[] } | { error: string };

/**
 * Pause a goal after `lastDay`. The one rule both the server and the guest path
 * apply, so a pause a guest could make is one the server would accept on sign-up.
 * The caller handles "already paused" first -- that is a no-op, not an error.
 */
export function addPause(goal: GoalSchedule, lastDay: string): PauseChange {
    if (lastDay < goal.startDate) return { error: 'This goal has not started yet. Delete it instead.' };
    if (lastDay > goalLastDay(goal)) return { error: 'This goal has already finished.' };

    const previous = goal.pauses?.[goal.pauses.length - 1];
    if (previous && lastDay < previous.lastDay) return { error: 'A pause cannot start before the one before it.' };

    return { pauses: [...(goal.pauses ?? []), { lastDay }] };
}

/**
 * Resume a paused goal from `resumedOn`. The caller handles "not paused" first --
 * that is a no-op, not an error.
 */
export function endPause(goal: Pick<Goal, 'pauses'>, resumedOn: string): PauseChange {
    const pause = currentPause(goal);
    if (!pause) return { error: 'This goal is not paused.' };
    if (resumedOn <= pause.lastDay) return { error: 'A goal resumes after the last day it ran.' };

    return { pauses: [...goal.pauses!.slice(0, -1), { ...pause, resumedOn }] };
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
