/**
 * Goal progress across a goal's whole run, startDate to endDate.
 *
 * Shared for the same reason streak.ts is: guest goals never reach the server, so
 * GoalService runs this on the device instead of calling /api/goals/progress, and
 * the two answers cannot drift apart.
 *
 * Works on 'YYYY-MM-DD' day keys only. The timezone is settled before anything gets
 * here — the caller turns "now" into a local day with dayKeyFromMillis.
 */
import { isGoalScheduledOn } from '../types/goal.types';
import type { Goal, GoalCompletionsByGoal, GoalProgress } from '../types/goal.types';

/**
 * How many days the goal is scheduled on, from startDate to endDate inclusive.
 *
 * Walked a day at a time through isGoalScheduledOn, the one place that decides
 * which days a goal falls on, so a partial first or last week counts only the days
 * it really has. Stepped in UTC for the same reason streak.ts steps days in UTC: the
 * key is already a calendar day, and stepping in local time would shift it again.
 */
function countScheduledDays(goal: Goal): number {
    const cursor = new Date(`${goal.startDate}T00:00:00.000Z`);
    let day = goal.startDate;
    let count = 0;

    while (day <= goal.endDate) {
        if (isGoalScheduledOn(goal, day)) count++;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        day = cursor.toISOString().slice(0, 10);
    }

    return count;
}

/**
 * Every goal's progress over its full run.
 *
 * completed: days marked done, counting only days the goal is scheduled on and none
 *            after today — the same rules the Diary uses to decide a day's status,
 *            so a completion stored for a future or unscheduled day cannot fill the ring.
 * target:    every day the goal is scheduled on between its start and end dates.
 * percent:   round(completed / target * 100), clamped to 0..100.
 */
export function computeGoalProgress(
    goals: Goal[],
    completionsByGoal: GoalCompletionsByGoal,
    today: string
): GoalProgress[] {
    return goals.map(goal => {
        const completed = (completionsByGoal[goal.id!] ?? []).filter(date =>
            date <= today && isGoalScheduledOn(goal, date)
        ).length;

        const target = countScheduledDays(goal);
        const percent = target > 0
            ? Math.min(100, Math.max(0, Math.round((completed / target) * 100)))
            : 0;

        return { goalId: goal.id!, name: goal.name, completed, target, percent };
    });
}
