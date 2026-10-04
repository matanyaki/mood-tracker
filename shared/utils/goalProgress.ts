/**
 * Goal progress across a goal's whole run, startDate to its last day.
 *
 * Shared for the same reason streak.ts is: guest goals never reach the server, so
 * GoalService runs this on the device instead of calling /api/goals/progress, and
 * the two answers cannot drift apart.
 *
 * Works on 'YYYY-MM-DD' day keys only. The timezone is settled before anything gets
 * here — the caller turns "now" into a local day with dayKeyFromMillis.
 */
import { isGoalScheduledOn, goalLastDay, plannedDayCount, isGoalPaused, nextDay } from '../types/goal.types';
import type { Goal, GoalCompletionsByGoal, GoalProgress } from '../types/goal.types';

/**
 * How many days the goal has been scheduled on from its start through `through`
 * (inclusive) -- pauses skipped, nothing past the goal's last day.
 *
 * Walked a day at a time through isGoalScheduledOn, the one place that decides
 * which days a goal falls on, so a partial first or last week counts only the days
 * it really has.
 *
 * What the Goals screen asks before a pause (would it keep anything?) and before a
 * resume (how many goal days are still to go?).
 */
export function countScheduledDaysThrough(
    goal: Pick<Goal, 'startDate' | 'endDate' | 'daysOfWeek' | 'pauses'>,
    through: string
): number {
    const lastDay = goalLastDay(goal) < through ? goalLastDay(goal) : through;
    let count = 0;

    for (let day = goal.startDate; day <= lastDay; day = nextDay(day)) {
        if (isGoalScheduledOn(goal, day)) count++;
    }

    return count;
}

/**
 * Every goal's progress over its full run.
 *
 * completed: days marked done, counting only days the goal is scheduled on and none
 *            after today — the same rules the Diary uses to decide a day's status,
 *            so a completion stored for a future, unscheduled or paused day cannot
 *            fill the ring.
 * target:    every day the goal was planned for. A pause does not shrink it: the
 *            goal picks up where it left off on resume and runs until it is met.
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

        const target = plannedDayCount(goal);
        const percent = target > 0
            ? Math.min(100, Math.max(0, Math.round((completed / target) * 100)))
            : 0;

        return { goalId: goal.id!, name: goal.name, completed, target, percent, paused: isGoalPaused(goal) };
    });
}
