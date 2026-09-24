// The schedule vocabulary itself lives in shared/types/goal.types.ts so the server
// schema and the client agree on one list. This module adds only what the UI needs
// on top of it: the labels drawn on the boxes.
import { TIMES_OF_DAY } from '../../shared/types/goal.types';

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

/**
 * What the times-per-week picker offers.
 *
 * Stops at 7 because a goal has to pick exactly that many weekday boxes and there
 * are only seven of them -- an eighth option would be one the form could never
 * satisfy and the server would always reject.
 */
export const TIMES_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
