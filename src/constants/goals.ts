// The schedule vocabulary itself lives in shared/types/goal.types.ts so the server
// schema and the client agree on one list. This module adds only what the UI needs
// on top of it: the labels drawn on the boxes.
import { TIMES_OF_DAY, DURATION_UNITS } from '../../shared/types/goal.types';

export { TIMES_OF_DAY };
export type { TimeOfDay, Goal } from '../../shared/types/goal.types';

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

/** Box labels for the goal's length. 'date' is the end date picked on the calendar. */
export const DURATION_UNIT_LABELS: Record<typeof DURATION_UNITS[number], string> = {
    days: 'DAYS',
    weeks: 'WEEKS',
    months: 'MONTHS',
    date: 'DATE',
};
