import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Pencil, Pause, Play, Trash2 } from 'lucide-react-native';
import type { Goal } from '@shared/types';
import { currentPause, goalLastDay, goalDuration } from '../../../shared/types';
import { WEEKDAY_LABELS, TIME_OF_DAY_LABELS } from '../../constants/goals';
import { GOAL_TEXT } from '../../constants/colors';
import PixelCard from '../ui/PixelCard';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SPACE, hitSlopFor } from '../../constants/layout';
import {
    OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER, PRESSED, PRESS_SINK,
} from '../../constants/pixel';

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    /**
     * Pauses the goal, keeping its past. Left out by the caller for a goal with no
     * days left to pause (it already finished). Drawn only on a running goal.
     */
    onPause?: (goal: Goal) => void;
    /** Picks a paused goal up where it left off. Drawn only on a paused goal. */
    onResume?: (goal: Goal) => void;
    onDelete: (goal: Goal) => void;
}

/** The goal accent, matching the green the Fab uses for the Goals action. */
const GOAL_ACCENT = '#10B981';

/** 'YYYY-MM-DD' -> 'DD/MM/YY', which is what fits next to its twin on one line. */
const shortDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year.slice(2)}`;
};

/** '[2W + PAUSE]' from the parts that apply, or nothing when none do. */
const bracket = (parts: string[]) => {
    const shown = parts.filter(Boolean);
    return shown.length ? `[${shown.join(' + ')}]` : '';
};

/** '2W', '10D', '3M' -- or nothing for a goal whose end date was picked, which the dates already say. */
const lengthTag = (goal: Goal) => {
    const { unit, count } = goalDuration(goal);
    return unit === 'date' ? '' : `${count}${unit.charAt(0).toUpperCase()}`;
};

/**
 * One goal in the list, drawn as a pixel card.
 *
 * The schedule is spelled out rather than summarised into a sentence: the three
 * facts that define a goal -- how often, which days, which parts of the day -- are
 * exactly the three the form asked for, so seeing them back in the same shapes is
 * what makes an edit predictable.
 *
 * A paused goal keeps its card, greyed, with resume in the pause button's place.
 * Edit is held back until it resumes: changing the schedule mid-pause could move
 * the start past the day it paused on.
 */
export default function GoalCard({ goal, onEdit, onPause, onResume, onDelete }: GoalCardProps) {
    const days = [...goal.daysOfWeek].sort((a, b) => a - b);
    const pause = currentPause(goal);
    const isPaused = !!pause;
    // Later than endDate once a resumed goal has been pushed out by its pauses.
    const lastDay = goalLastDay(goal);
    const wasPushed = !isPaused && lastDay !== goal.endDate;

    return (
        // The green bar is what says "running"; a paused goal drops it to slate.
        <PixelCard
            padding={CARD_PADDING}
            accentColor={isPaused ? INK_MUTED : GOAL_ACCENT}
            style={[styles.card, isPaused && styles.cardPaused]}
        >
            <View style={styles.header}>
                <Text style={[styles.name, isPaused && styles.namePaused]} numberOfLines={2}>
                    {goal.name}
                </Text>

                <View style={styles.actions}>
                    {!isPaused && (
                        <Pressable
                            onPress={() => onEdit(goal)}
                            hitSlop={hitSlopFor(ACTION_SIZE)}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${goal.name}`}
                        >
                            <Pencil size={14} color={INK} strokeWidth={2.5} />
                        </Pressable>
                    )}
                    {!isPaused && onPause && (
                        <Pressable
                            onPress={() => onPause(goal)}
                            hitSlop={hitSlopFor(ACTION_SIZE)}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Pause ${goal.name}`}
                        >
                            <Pause size={14} color={INK} strokeWidth={2.5} />
                        </Pressable>
                    )}
                    {isPaused && onResume && (
                        <Pressable
                            onPress={() => onResume(goal)}
                            hitSlop={hitSlopFor(ACTION_SIZE)}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Resume ${goal.name}`}
                        >
                            <Play size={14} color={GOAL_ACCENT} strokeWidth={2.5} />
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => onDelete(goal)}
                        hitSlop={hitSlopFor(ACTION_SIZE)}
                        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${goal.name}`}
                    >
                        <Trash2 size={14} color="#EF4444" strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <Text style={styles.meta}>
                {shortDate(goal.startDate)} {'>'} {isPaused
                    ? `PAUSED AFTER ${shortDate(pause.lastDay)}`
                    : `${shortDate(lastDay)}  ${bracket([lengthTag(goal), wasPushed ? 'PAUSE' : ''])}`}
            </Text>

            {/* The whole week is drawn, not just the chosen days, so the pattern
                reads at a glance -- three lit boxes out of seven says more than
                a list of three names. */}
            <View style={styles.weekRow}>
                {WEEKDAY_LABELS.map((label, index) => {
                    const isOn = days.includes(index);
                    return (
                        <View key={label} style={[styles.dayPip, isOn && styles.dayPipOn]}>
                            <Text style={[styles.dayPipText, isOn && styles.dayPipTextOn]}>
                                {label.charAt(0)}
                            </Text>
                        </View>
                    );
                })}
                <Text style={styles.weekCount}>{goal.timesPerWeek}x / WEEK</Text>
            </View>

            <Text style={styles.times} numberOfLines={1}>
                {goal.timesOfDay.map(time => TIME_OF_DAY_LABELS[time]).join(' * ')}
            </Text>
        </PixelCard>
    );
}

/**
 * The edit / pause / delete squares. 32 with 12 between them, so each one's slop
 * reaches 44 without overlapping its neighbour's (at 28 with 8 between, every pair
 * of targets overlapped by 8px).
 */
const ACTION_SIZE = 32;

const styles = StyleSheet.create({
    card: {
        gap: SPACE.sm,
    },
    cardPaused: {
        backgroundColor: '#F4F2EC',
    },
    namePaused: {
        color: INK_MUTED,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACE.sm,
    },
    name: {
        ...TYPE.h3,
        flex: 1,
        letterSpacing: 0.5,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACE.md,
    },
    actionButton: {
        width: ACTION_SIZE,
        height: ACTION_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    actionButtonPressed: {
        // Sinks toward its own corner, matching how every other pixel control
        // answers a press.
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
        backgroundColor: PRESSED,
    },
    meta: {
        ...TYPE.caption,
    },
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.xs,
    },
    dayPip: {
        // 20, up from 18: the letter inside went from 8px to 12px.
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    dayPipOn: {
        backgroundColor: INK,
        borderColor: INK,
    },
    dayPipText: {
        ...TYPE.label,
        letterSpacing: 0,
        color: INK_MUTED,
    },
    dayPipTextOn: {
        color: PAPER,
    },
    weekCount: {
        ...TYPE.label,
        marginLeft: SPACE.sm,
        color: GOAL_TEXT, // The accent green is 2.5:1 as text
    },
    times: {
        ...TYPE.label,
        color: INK_MUTED,
    },
});
