// The schedule vocabulary itself lives in shared/types/goal.types.ts so the server
// schema and the client agree on one list. This module adds only what the UI needs
// on top of it: the labels drawn on the boxes.
import { TIMES_OF_DAY, DURATION_UNITS, SCHEDULE_MODES } from '../../shared/types/goal.types';
import type { DurationUnit, ScheduleMode } from '../../shared/types/goal.types';

export { TIMES_OF_DAY, DURATION_UNITS, SCHEDULE_MODES };
export type { TimeOfDay, Goal, DurationUnit, ScheduleMode } from '../../shared/types/goal.types';

/**
 * Weekday labels, indexed by the same 0-6 the goal stores (0 = Sunday, matching
 * Date.prototype.getDay()). Three letters because that is what fits a seventh of a
 * phone's width in Silkscreen, which draws ~0.76em per bold character.
 */
export const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Box labels for the four time-of-day slots, in the order the form draws them. */
export const TIME_OF_DAY_LABELS: Record<typeof TIMES_OF_DAY[number], string> = {
    morning: 'MORNING',
    noon: 'NOON',
    afternoon: 'AFTERNOON',
    night: 'NIGHT',
};

/**
 * Box labels for the length units, in the order the form draws them. Also the
 * count field's eyebrow -- "[ WEEKS ]" -- so the number reads with its unit.
 */
export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
    days: 'DAYS',
    weeks: 'WEEKS',
    months: 'MONTHS',
    date: 'DATE',
};

/**
 * Box labels for the two ways to give a goal's days, in the order the form draws
 * them: the same weekdays every week, or days picked one by one on a calendar.
 */
export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
    weekdays: 'SAME DAYS',
    dates: 'PICK DAYS',
};
