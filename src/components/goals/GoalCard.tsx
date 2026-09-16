import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import type { Goal } from '@shared/types';
import { WEEKDAY_LABELS, TIME_OF_DAY_LABELS } from '../../constants/goals';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED,
    SHADOW_OFFSET, BORDER_W, BORDER_W_INNER, ACCENT_BAR_W,
} from '../../constants/pixel';

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (goal: Goal) => void;
}

/** The goal accent, matching the green the Fab uses for the Goals action. */
const GOAL_ACCENT = '#10B981';

/** 'YYYY-MM-DD' -> 'DD/MM/YY', which is what fits next to its twin on one line. */
const shortDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year.slice(2)}`;
};

/**
 * One goal in the list, drawn as a pixel card.
 *
 * The schedule is spelled out rather than summarised into a sentence: the three
 * facts that define a goal -- how often, which days, which parts of the day -- are
 * exactly the three the form asked for, so seeing them back in the same shapes is
 * what makes an edit predictable.
 */
export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
    const days = [...goal.daysOfWeek].sort((a, b) => a - b);

    return (
        <View style={styles.wrapper}>
            <View style={styles.shadow} pointerEvents="none" />

            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={2}>{goal.name}</Text>

                    <View style={styles.actions}>
                        <Pressable
                            onPress={() => onEdit(goal)}
                            hitSlop={8}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                        >
                            <Pencil size={14} color={INK} strokeWidth={2.5} />
                        </Pressable>
                        <Pressable
                            onPress={() => onDelete(goal)}
                            hitSlop={8}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                        >
                            <Trash2 size={14} color="#EF4444" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.meta}>
                    {shortDate(goal.startDate)} {'>'} {shortDate(goal.endDate)}
                    {'  '}[{goal.months}M]
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginRight: SHADOW_OFFSET,
        marginBottom: SHADOW_OFFSET,
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    card: {
        backgroundColor: PAPER,
        padding: 14,
        gap: 10,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
        borderLeftWidth: ACCENT_BAR_W,
        borderLeftColor: GOAL_ACCENT,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    name: {
        flex: 1,
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    actionButtonPressed: {
        // Sinks toward its own corner, matching how every other pixel control
        // answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    meta: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dayPip: {
        width: 18,
        height: 18,
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
        fontSize: 8,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
    },
    dayPipTextOn: {
        color: PAPER,
    },
    weekCount: {
        marginLeft: 6,
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: GOAL_ACCENT,
        letterSpacing: 1,
    },
    times: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },
});
