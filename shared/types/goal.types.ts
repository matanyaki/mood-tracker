import { z } from 'zod';

/**
 * The four slots a goal can be scheduled in. Ordered through the day, because the
 * form draws them in this order and a set of times reads as a sequence.
 */
export const TIMES_OF_DAY = ['morning', 'noon', 'afternoon', 'night'] as const;

export type TimeOfDay = typeof TIMES_OF_DAY[number];

export const TimeOfDaySchema = z.enum(TIMES_OF_DAY);

/**
 * How a goal's length is given. 'days', 'weeks' and 'months' are a count from
 * startDate; 'date' is an end date the user picked, with no count at all.
 * Ordered shortest first, because the form draws them in this order.
 */
export const DURATION_UNITS = ['days', 'weeks', 'months', 'date'] as const;

export type DurationUnit = typeof DURATION_UNITS[number];

export const DurationUnitSchema = z.enum(DURATION_UNITS);

/**
 * How a goal's days are given. 'weekdays' repeats the same weekdays from startDate
 * for its length; 'dates' is every day picked one by one on a calendar, so each
 * week can differ.
 */
export const SCHEDULE_MODES = ['weekdays', 'dates'] as const;

export type ScheduleMode = typeof SCHEDULE_MODES[number];

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
    // Absent means 'weekdays': every goal saved before picked days existed. Read
    // only through isDatesSchedule.
    scheduleMode: z.enum(SCHEDULE_MODES).optional(),
    // 'dates' only: every day the goal runs on, YYYY-MM-DD, sorted and unique. The
    // rest of a 'dates' schedule is derived from it -- see datesScheduleFields.
    dates: z.array(z.string()).optional(),
    startDate: z.string(), // YYYY-MM-DD, chosen by the user; dates[0] for 'dates'
    // The goal's length. Read only through goalDuration, and not used for 'dates'.
    // A goal saved before units existed has only `months`, and means unit 'months'.
    durationUnit: DurationUnitSchema.optional(),
    durationCount: z.number().int().positive().optional(),
    months: z.number().int().positive().optional(),
    endDate: z.string(),   // YYYY-MM-DD, always resolveEndDate(goal)
    // For 'dates', the most picks in any Sun-Sat week.
    timesPerWeek: z.number().int().positive(),
    // 0 = Sunday, matching Date.prototype.getDay(). Empty for 'dates'.
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    timesOfDay: z.array(TimeOfDaySchema).min(1),
    // Oldest first; only the last one can still be open. Absent on a goal never
    // paused. Written only by the pause and resume actions, never by create or edit.
    pauses: z.array(GoalPauseSchema).optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

// endDate is derived from startDate and the duration, so the two can't disagree. It
// is sent only for unit 'date', where it IS the duration; for every other unit the
// server computes it with resolveEndDate. userId comes from the verified token, the
// same way it does for an entry or a greeting. pauses have their own actions
// (POST /:id/pause, /:id/resume).
export type CreateGoalDTO = Omit<Goal, 'id' | 'userId' | 'endDate' | 'pauses' | 'createdAt' | 'updatedAt'> & {
    endDate?: string;
};
export type UpdateGoalDTO = CreateGoalDTO;

/** Whether a goal runs on picked dates rather than repeating weekdays. */
export const isDatesSchedule = (goal: Pick<Goal, 'scheduleMode'>) => goal.scheduleMode === 'dates';

/**
 * A 'dates' schedule's fields, all derived from the picks: start and end are the
 * first and last, there are no weekdays, and timesPerWeek is the busiest Sun-Sat
 * week. Empty picks give no start or end -- goalScheduleError turns those away.
 */
export function datesScheduleFields(dates: string[]) {
    const sorted = [...new Set(dates)].sort();
    const perWeek = new Map<string, number>();
    for (const date of sorted) {
        const weekStart = addDays(date, -weekdayOf(date));
        perWeek.set(weekStart, (perWeek.get(weekStart) ?? 0) + 1);
    }
    return {
        scheduleMode: 'dates' as const,
        dates: sorted,
        startDate: sorted[0],
        endDate: sorted[sorted.length - 1],
        daysOfWeek: [] as number[],
        timesPerWeek: Math.max(0, ...perWeek.values()),
    };
}

/**
 * What a create or edit body is stored as. The server and the guest path both
 * write through this, so neither trusts the derived fields a client sent: a
 * 'dates' goal's start, end, weekdays and times a week come from its picks, and
 * every other goal's endDate from resolveEndDate.
 *
 * The mode is always written, so an edit that switches it back to 'weekdays'
 * replaces the stored one. Only call it on a body goalScheduleError accepted.
 */
export function resolveGoalSchedule(data: CreateGoalDTO): CreateGoalDTO & { endDate: string } {
    if (isDatesSchedule(data)) {
        // The length fields mean nothing for picked days, so they are not stored.
        const { durationUnit, durationCount, months, ...rest } = data;
        return { ...rest, ...datesScheduleFields(data.dates ?? []) };
    }
    return { ...data, scheduleMode: 'weekdays', endDate: resolveEndDate(data)! };
}

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
 * not change it -- the run is pushed out instead. goalScheduleError turns away a
 * goal none of whose picked weekdays fall inside its run, so a valid goal never has
 * a target of zero.
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

/** The fields that say how long a goal runs. */
type GoalDurationFields = Pick<Goal, 'durationUnit' | 'durationCount' | 'months' | 'scheduleMode' | 'dates'>;

/**
 * A goal's length as a unit and a count. The ONLY reader of durationUnit,
 * durationCount and months, so a goal saved with just `months` reads the same as
 * one saved with a unit.
 *
 * The count is 0 for 'date' -- that goal's length is its endDate -- and 0 for a
 * goal with no length stored at all.
 */
export function goalDuration(goal: GoalDurationFields): { unit: DurationUnit; count: number } {
    const unit = goal.durationUnit ?? 'months';
    if (unit === 'date') return { unit, count: 0 };
    return { unit, count: goal.durationCount ?? goal.months ?? 0 };
}

/**
 * The one and only endDate rule. Both startDate and the end date are days of the
 * goal, so N days ends on day N, not the day after it:
 *
 * - days:   startDate + (count - 1) days
 * - weeks:  startDate + (count * 7 - 1) days
 * - months: computeEndDate(startDate, count), unchanged from before units existed
 * - date:   the endDate passed in, as the user picked it
 * - picked dates (scheduleMode 'dates'): the last of them
 *
 * Null when there is nothing to resolve: a count of 0, a 'date' goal with no
 * endDate, or no picked dates. The caller decides whether that is an error.
 */
export function resolveEndDate(
    goal: GoalDurationFields & Pick<Goal, 'startDate'> & { endDate?: string }
): string | null {
    if (isDatesSchedule(goal)) return goal.dates?.length ? [...goal.dates].sort()[goal.dates.length - 1] : null;

    const { unit, count } = goalDuration(goal);
    if (unit === 'date') return goal.endDate ?? null;
    if (count === 0) return null;

    switch (unit) {
        case 'days':   return addDays(goal.startDate, count - 1);
        case 'weeks':  return addDays(goal.startDate, count * 7 - 1);
        case 'months': return computeEndDate(goal.startDate, count);
    }
}

/** The longest a goal can run, per counted unit. A 'date' goal has its own limit below. */
export const MAX_DURATION = { days: 366, weeks: 52, months: 24 } as const;

/** How far past startDate a picked end date can be, and how far apart picked days can be. */
const MAX_DATE_SPAN_DAYS = 366;

/** The most days a 'dates' goal can pick. */
export const MAX_PLAN_DATES = 366;

/** Whether a string is a real 'YYYY-MM-DD' day: the pattern alone lets '2026-02-31' through. */
const isValidDay = (date: string) => GOAL_DATE_PATTERN.test(date) && addDays(date, 0) === date;

/** goalScheduleError's rules for picked dates. `today`, when given, turns away past picks. */
function datesScheduleError(dates: string[], today?: string): string | null {
    if (dates.length === 0) return 'Pick at least one day on the calendar.';
    if (dates.length > MAX_PLAN_DATES) return `A goal can have at most ${MAX_PLAN_DATES} picked days.`;
    if (!dates.every(isValidDay)) return 'Pick valid days.';
    if (new Set(dates).size !== dates.length) return 'Each day can only be picked once.';

    const sorted = [...dates].sort();
    if (sorted[sorted.length - 1] > addDays(sorted[0], MAX_DATE_SPAN_DAYS)) {
        return 'The picked days can span at most a year.';
    }
    if (today && sorted[0] < today) return 'Picked days cannot be in the past.';
    return null;
}

/**
 * Why a goal's schedule is not allowed, or null when it is. The ONE set of rules --
 * the server, the guest path and the form all ask this, so a goal the form accepts
 * is one the server accepts too. Checked in order; the first problem wins, and the
 * message is written to be shown to the user as it is.
 *
 * Takes a CreateGoalDTO as well as a Goal: endDate is read only for unit 'date',
 * where it is what the user picked. Every other unit resolves its own. A 'dates'
 * goal is checked on its picks alone -- everything else about it is derived.
 *
 * `today` is passed on create only, as the device's day (the same way a pause
 * names its own): a new goal cannot pick a day already behind it. An edit keeps
 * the past picks its history depends on.
 */
export function goalScheduleError(
    goal: GoalDurationFields & Pick<Goal, 'startDate' | 'daysOfWeek' | 'timesPerWeek'> & { endDate?: string },
    today?: string
): string | null {
    if (isDatesSchedule(goal)) return datesScheduleError(goal.dates ?? [], today);

    if (goal.daysOfWeek.length === 0) return 'Pick at least one day of the week.';
    if (new Set(goal.daysOfWeek).size !== goal.daysOfWeek.length) {
        return 'Each day of the week can only be picked once.';
    }
    // The picked days ARE the plan, so the count must agree with them.
    if (goal.timesPerWeek !== goal.daysOfWeek.length) {
        return 'Times a week must match the number of days picked.';
    }

    const { unit, count } = goalDuration(goal);
    if (unit === 'date') {
        const end = goal.endDate;
        if (!end || !isValidDay(end)) return 'Pick a valid end date.';
        if (end < goal.startDate) return 'The end date cannot be before the start date.';
        if (end > addDays(goal.startDate, MAX_DATE_SPAN_DAYS)) {
            return `The end date can be at most ${MAX_DATE_SPAN_DAYS} days after the start date.`;
        }
    } else {
        if (count <= 0) return `Pick how many ${unit} the goal runs for.`;
        if (count > MAX_DURATION[unit]) return `A goal can run for at most ${MAX_DURATION[unit]} ${unit}.`;
    }

    // Not null: every case that resolves to null was turned away above.
    const endDate = resolveEndDate(goal)!;
    if (plannedDayCount({ ...goal, endDate }) === 0) {
        return 'None of the picked days fall between the start and end date.';
    }
    return null;
}

/**
 * Whether a goal is scheduled on one 'YYYY-MM-DD' day.
 *
 * A goal stores a window and a set of weekdays, never a list of dates, so the days
 * it falls on are derived — this is the one place that derives them, and the Diary
 * calendar and the day sheet both read it rather than each deciding for themselves.
 *
 * Both ends of the window count: a goal that runs three months from the 14th is
 * still running on its last day. A day inside a pause is not scheduled at all.
 * A 'dates' goal is scheduled on its picks as pauses have moved them, which never
 * land inside a pause, so the same three tests answer for both modes.
 *
 * The range test is a string comparison because 'YYYY-MM-DD' sorts lexically, and
 * the weekday is read off a LOCAL Date built from the parts. `new Date('2026-09-14')`
 * would parse as UTC midnight, which is the previous day — and so the previous
 * weekday — anywhere west of Greenwich.
 */
export function isGoalScheduledOn(goal: GoalSchedule, date: string): boolean {
    if (date < goal.startDate || date > goalLastDay(goal)) return false;
    return isOnGoalPlanDay(goal, date) && !isInPause(goal, date);
}

/** The fields that decide which days a goal falls on. */
type GoalSchedule = Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek' | 'pauses' | 'scheduleMode' | 'dates'>;

/**
 * Whether a day is one the goal's plan puts it on, ignoring its window: one of its
 * weekdays, or one of its picked dates as pauses have moved them. The ONE place
 * that decides goal days -- a weekday goal's pauses are left to isInPause.
 */
function isOnGoalPlanDay(goal: Pick<Goal, 'daysOfWeek' | 'scheduleMode' | 'dates' | 'pauses'>, date: string): boolean {
    if (isDatesSchedule(goal)) return effectivePlanDates(goal).includes(date);
    return goal.daysOfWeek.includes(weekdayOf(date));
}

/** A 'YYYY-MM-DD' day's weekday, 0 = Sunday, read off a LOCAL Date built from the parts. */
function weekdayOf(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
}

/** Whole days from one 'YYYY-MM-DD' to another, counted in UTC like addDays. */
function daysBetween(from: string, to: string): number {
    return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000;
}

/** Memo for effectivePlanDates, keyed the same way as lastDayCache below. */
const planDatesCache = new WeakMap<object, string[]>();

/**
 * A 'dates' goal's picks as its pauses have moved them, sorted.
 *
 * Pauses apply oldest first. A resumed pause moves every pick after its lastDay
 * later by the days it skipped -- (resumedOn - lastDay - 1) -- so the picks keep
 * their spacing and none is lost. An open pause drops every pick after its lastDay:
 * nothing is scheduled until it resumes.
 *
 * Moving the picks is what a weekday goal does by walking on to its next weekday;
 * picked dates have nothing past the last one to walk to.
 */
export function effectivePlanDates(goal: Pick<Goal, 'dates' | 'pauses'>): string[] {
    const cached = planDatesCache.get(goal);
    if (cached) return cached;

    let dates = [...(goal.dates ?? [])].sort();
    for (const pause of goal.pauses ?? []) {
        if (!pause.resumedOn) {
            dates = dates.filter(date => date <= pause.lastDay);
            break;
        }
        const shift = daysBetween(pause.lastDay, pause.resumedOn) - 1;
        dates = dates.map(date => (date > pause.lastDay ? addDays(date, shift) : date));
    }

    planDatesCache.set(goal, dates);
    return dates;
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
 * How many days the goal was planned for: its weekdays from startDate to endDate,
 * or its picked dates.
 *
 * Pauses do not change this number -- they change when the run ends. It is the
 * progress ring's target, and what a resumed goal keeps running until it has had.
 */
export function plannedDayCount(
    goal: Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek' | 'scheduleMode' | 'dates'>
): number {
    if (isDatesSchedule(goal)) return goal.dates?.length ?? 0;

    let count = 0;
    for (let day = goal.startDate; day <= goal.endDate; day = nextDay(day)) {
        if (isOnGoalPlanDay(goal, day)) count++;
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
 *   A 'dates' goal ends on its last pick as the pauses moved it (effectivePlanDates).
 *
 * Everything that asks "is this day part of the goal" goes through here.
 */
export function goalLastDay(goal: GoalSchedule): string {
    const pause = currentPause(goal);
    if (pause) return pause.lastDay;
    if (!goal.pauses?.length) return goal.endDate;
    if (isDatesSchedule(goal)) {
        const dates = effectivePlanDates(goal);
        return dates[dates.length - 1] ?? goal.endDate;
    }

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
            if (isOnGoalPlanDay(goal, day) && !isInPause(goal, day)) count++;
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

/**
 * startDate plus `months` calendar months: the end date of a 'months' goal. Call
 * resolveEndDate rather than this, so every unit goes through the same rule.
 *
 * Built from the date parts rather than `new Date(...)` arithmetic so it stays on
 * the calendar the user picked from — a Date would drag the caller's timezone into
 * a value that has no time of day at all.
 *
 * A short month clamps: 31 Jan + 1 month is 28 (or 29) Feb, not 3 March.
 */
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
