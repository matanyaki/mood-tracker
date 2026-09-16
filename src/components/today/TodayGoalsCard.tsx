import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { format } from 'date-fns';
import { Check } from 'lucide-react-native';
import type { Goal, TimeOfDay } from '@shared/types';
import { isGoalScheduledOn } from '../../../shared/types';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from '../skeleton/SkeletonBox';
import { useGoalsQuery, useGoalCompletionsQuery } from '../../hooks/useGoalsQuery';
import { useGoalsController } from '../../controllers/useGoalsController';
import { TIMES_OF_DAY, TIME_OF_DAY_LABELS } from '../../constants/goals';
import { CARD_PADDING } from '../../constants/layout';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER,
} from '../../constants/pixel';

/** The goal accent, matching GoalCard, the calendar's goal pip and the Fab's Goals action. */
const GOAL_ACCENT = '#10B981';

/**
 * Where a goal is filed in this card.
 *
 * Completion is once for the whole day, so a goal that runs morning AND night is
 * still one checkbox -- listing it under both would offer two boxes for one fact.
 * It is filed under the earliest slot it has, and the rest are drawn on the row as
 * tags, so the day still reads in order and nothing is lost.
 *
 * TIMES_OF_DAY is already ordered through the day, so its index IS the ordering.
 */
const slotOf = (goal: Goal): number =>
    Math.min(...goal.timesOfDay.map(time => TIMES_OF_DAY.indexOf(time)));

/** The goal's other slots, in day order -- what the row shows as tags. */
const otherSlots = (goal: Goal, slot: TimeOfDay): TimeOfDay[] =>
    TIMES_OF_DAY.filter(time => time !== slot && goal.timesOfDay.includes(time));

interface GoalRowProps {
    goal: Goal;
    /** The section this row sits in, so the row can tag only the OTHER slots. */
    slot: TimeOfDay;
    done: boolean;
    onCheck: (goal: Goal) => void;
}

/**
 * One goal, one checkbox.
 *
 * A checked box is inert, not just styled: a completion is write-once (the date is
 * the document id and nothing ever deletes one), so there is no unchecked state to
 * go back to and the control should not invite a tap it cannot honour.
 */
function GoalRow({ goal, slot, done, onCheck }: GoalRowProps) {
    const tags = otherSlots(goal, slot);

    return (
        <Pressable
            onPress={() => onCheck(goal)}
            disabled={done}
            style={({ pressed }) => [styles.row, pressed && !done && styles.rowPressed]}
        >
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
                {done && <Check size={16} color={PAPER} strokeWidth={4} />}
            </View>

            <View style={styles.rowText}>
                <Text style={[styles.goalName, done && styles.goalNameDone]} numberOfLines={2}>
                    {goal.name}
                </Text>

                {/* Only the slots this row is NOT filed under, so the tags add
                    something the section heading has not already said. */}
                {tags.length > 0 && (
                    <View style={styles.tagRow}>
                        {tags.map(time => (
                            <View key={time} style={styles.tag}>
                                <Text style={styles.tagText}>{TIME_OF_DAY_LABELS[time]}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Pressable>
    );
}

interface TodayGoalsCardProps {
    /** Opens goal creation. Held by the screen, which owns the navigator. */
    onAddGoal: () => void;
}

/**
 * Everything scheduled for today, grouped through the day.
 *
 * Fetches its own data the way StreakCard and QuoteCard do, so TodayScreen only has
 * to place it. Scheduling is derived, not stored -- isGoalScheduledOn is the same
 * check the Diary reads, so the two screens can never disagree about what is due.
 *
 * This card is today and only today: it is the one day that can still be marked, so
 * there is no other date for it to offer. Every other day is read-only, in the Diary.
 */
export default function TodayGoalsCard({ onAddGoal }: TodayGoalsCardProps) {
    const goalsQuery = useGoalsQuery();
    const completionsQuery = useGoalCompletionsQuery();
    const { markGoalDone } = useGoalsController();

    // Read once per mount, for the same reason the Diary does: a re-render must not
    // move which day this card is about half way through using it.
    const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));

    /**
     * Goals ticked in THIS session, held alongside the fetched completions.
     *
     * The controller invalidates ['goalCompletions'] on a successful mark, so the
     * query catches up on its own -- this only covers the round trip, so the box
     * locks under the finger instead of a second later. Rolled back if the write
     * fails, which is the one case where the box has to come back.
     */
    const [justMarked, setJustMarked] = useState<string[]>([]);

    const completions = completionsQuery.data;

    const sections = useMemo(() => {
        const dueToday = (goalsQuery.data ?? []).filter(goal => isGoalScheduledOn(goal, today));

        return TIMES_OF_DAY
            .map((time, index) => ({
                time,
                goals: dueToday.filter(goal => slotOf(goal) === index),
            }))
            // Empty parts of the day are left out rather than drawn as blank
            // headings -- the card says what is due, not what a day could hold.
            .filter(section => section.goals.length > 0);
    }, [goalsQuery.data, today]);

    const isDone = useCallback((goal: Goal) =>
        justMarked.includes(goal.id!) || (completions?.[goal.id!] ?? []).includes(today),
        [justMarked, completions, today]);

    const handleCheck = useCallback((goal: Goal) => {
        // "Are you sure?" because there is no way back: marking a day done writes a
        // record that nothing in the app deletes.
        Alert.alert(
            'Are you sure?',
            `Mark "${goal.name}" done for today? This cannot be undone.`,
            [
                {
                    text: 'Yes',
                    onPress: async () => {
                        const goalId = goal.id!;
                        setJustMarked(prev => prev.includes(goalId) ? prev : [...prev, goalId]);

                        try {
                            await markGoalDone(goalId, today);
                        } catch {
                            setJustMarked(prev => prev.filter(id => id !== goalId));
                            Alert.alert('Error', 'Could not mark that goal done. Please try again.');
                        }
                    },
                },
                { text: 'No', style: 'cancel' },
            ]
        );
    }, [markGoalDone, today]);

    const isEmpty = !goalsQuery.isLoading && !completionsQuery.isLoading
        && !goalsQuery.isError && !completionsQuery.isError
        && sections.length === 0;

    // Nothing due today is not a card's worth of anything to say, so it collapses to
    // the one row that IS useful: the way to add a goal. The eyebrow goes with it --
    // a heading over a single CTA only restates the CTA.
    if (isEmpty) {
        return (
            <PixelCard padding={CARD_PADDING} accentColor={GOAL_ACCENT}>
                <Pressable
                    onPress={onAddGoal}
                    style={({ pressed }) => [styles.addRow, pressed && styles.rowPressed]}
                >
                    <Text style={styles.addText}>+ ADD A GOAL FOR TODAY</Text>
                </Pressable>
            </PixelCard>
        );
    }

    return (
        <PixelCard padding={CARD_PADDING} accentColor={GOAL_ACCENT}>
            <Text style={styles.eyebrow}>[ TODAY'S GOALS ]</Text>

            {goalsQuery.isLoading || completionsQuery.isLoading ? (
                // Two placeholder rows at the height of a real one, so the card does
                // not resize under the reader when the list arrives.
                <View>
                    <View style={styles.skeletonRow}>
                        <SkeletonBox width={26} height={26} borderRadius={0} />
                        <SkeletonBox width={140} height={14} borderRadius={0} />
                    </View>
                    <View style={[styles.skeletonRow, styles.skeletonSpacer]}>
                        <SkeletonBox width={26} height={26} borderRadius={0} />
                        <SkeletonBox width={110} height={14} borderRadius={0} />
                    </View>
                </View>
            ) : goalsQuery.isError || completionsQuery.isError ? (
                // A failed fetch must not be drawn as an empty day -- that tells the
                // user they have nothing due when they may have a full one.
                <View style={styles.messageBlock}>
                    <Text style={styles.messageText}>Could not load your goals.</Text>
                    <Pressable
                        onPress={() => { goalsQuery.refetch(); completionsQuery.refetch(); }}
                        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                    >
                        <Text style={styles.retryText}>[ TRY AGAIN ]</Text>
                    </Pressable>
                </View>
            ) : (
                sections.map((section, index) => (
                    <View key={section.time} style={index > 0 ? styles.divider : undefined}>
                        <Text style={styles.sectionLabel}>{TIME_OF_DAY_LABELS[section.time]}</Text>

                        {section.goals.map(goal => (
                            <GoalRow
                                key={goal.id}
                                goal={goal}
                                slot={section.time}
                                done={isDone(goal)}
                                onCheck={handleCheck}
                            />
                        ))}
                    </View>
                ))
            )}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    eyebrow: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: GOAL_ACCENT,
        letterSpacing: 2,
        marginBottom: 14,
    },
    divider: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
    },
    sectionLabel: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 6,
    },
    rowPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    addRow: {
        // No border or fill: the card's own outline is already around it, and a box
        // inside a box at this height reads as a button in a frame.
        justifyContent: 'center',
    },
    addText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: GOAL_ACCENT,
        letterSpacing: 1,
    },
    checkbox: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
        // Nudged down so the box centres on the first line of the name beside it
        // rather than on the whole two-line block.
        marginTop: 1,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    checkboxDone: {
        backgroundColor: GOAL_ACCENT,
        borderColor: GOAL_ACCENT,
    },
    rowText: {
        flex: 1,
    },
    goalName: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
        lineHeight: 20,
    },
    goalNameDone: {
        // Greyed rather than struck through: Silkscreen's strikethrough lands
        // between the pixel rows and tears the grid.
        color: INK_MUTED,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 6,
    },
    tag: {
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    tagText: {
        fontSize: 8,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    skeletonSpacer: {
        marginTop: 12,
    },
    messageBlock: {
        alignItems: 'center',
    },
    messageText: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 20,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    retryButtonPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#B8EFD6',
    },
    retryText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
});
