import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { GoalProgress } from '@shared/types';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from '../skeleton/SkeletonBox';
import PixelProgressRing from './PixelProgressRing';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

/**
 * Three rings to a row once the screen is wide enough to fit them, two below that.
 * An 88px ring needs roughly 100px of card width per column once the card's
 * padding and shadow are taken off.
 */
const THREE_COLUMN_MIN_WIDTH = 400;

interface GoalsProgressProps {
    /** From GET /api/goals/progress. Undefined until the first answer arrives. */
    goals: GoalProgress[] | undefined;
    isPending: boolean;
    onRetry: () => void;
    onAddGoal: () => void;
}

/**
 * Every goal's progress over its whole run, one pixel ring each.
 *
 * Not tied to the month filter above: a ring counts every scheduled day from the
 * goal's start date to its end date, whichever month is selected.
 */
export default function GoalsProgress({ goals, isPending, onRetry, onAddGoal }: GoalsProgressProps) {
    const { width } = useWindowDimensions();
    const columnWidth = width >= THREE_COLUMN_MIN_WIDTH ? '33.333%' : '50%';

    let body: React.ReactNode;

    if (!goals && isPending) {
        body = (
            <View style={styles.grid}>
                {[0, 1].map(i => (
                    <View key={i} style={[styles.cell, { width: columnWidth }]}>
                        <SkeletonBox width={88} height={88} borderRadius={0} />
                    </View>
                ))}
            </View>
        );
    } else if (!goals) {
        // A failed fetch is not drawn as "no goals" -- that would tell the user their
        // goals are gone when they are only unreachable.
        body = (
            <View style={styles.message}>
                <Text style={styles.messageTitle}>COULD NOT LOAD</Text>
                <Text style={styles.messageText}>Your goals could not be loaded.</Text>
                <Pressable
                    onPress={onRetry}
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                >
                    <Text style={styles.buttonText}>[ TRY AGAIN ]</Text>
                </Pressable>
            </View>
        );
    } else if (goals.length === 0) {
        body = (
            <View style={styles.message}>
                <Text style={styles.messageTitle}>NO GOALS YET</Text>
                <Text style={styles.messageText}>Add a goal to see how far along it is.</Text>
                <Pressable
                    onPress={onAddGoal}
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                >
                    <Text style={styles.buttonText}>[ ADD A GOAL ]</Text>
                </Pressable>
            </View>
        );
    } else {
        body = (
            <View style={styles.grid}>
                {goals.map(goal => (
                    <View
                        key={goal.goalId}
                        style={[styles.cell, { width: columnWidth }]}
                        accessible
                        accessibilityLabel={`${goal.name}: ${goal.completed} of ${goal.target} days done, ${goal.percent} percent`}
                    >
                        <Text style={styles.goalName} numberOfLines={1}>
                            {goal.name.toUpperCase()}
                        </Text>
                        <PixelProgressRing percent={goal.percent} />
                        <Text style={styles.count}>
                            {goal.completed} / {goal.target}
                        </Text>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <PixelCard padding={18} wrapperStyle={styles.cardWrapper}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>GOALS PROGRESS</Text>
                <Text style={styles.cardSubtitle}>Days done out of every scheduled day</Text>
            </View>

            {body}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    // Card, header, title and subtitle match EmotionBreakdown.
    cardWrapper: {
        marginBottom: 24,
    },
    cardHeader: {
        paddingBottom: 12,
        marginBottom: 16,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    cardTitle: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    cardSubtitle: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        marginTop: 6,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 20,
    },
    cell: {
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    goalName: {
        // Stretched to the cell so a long name truncates inside its column instead
        // of sizing itself wider than the column it is centred in.
        alignSelf: 'stretch',
        textAlign: 'center',
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    count: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
        marginTop: 8,
    },
    // Empty and failed states match the Insights error card and the waves chart's
    // empty state: bold title, muted centred line, paper [ BUTTON ].
    message: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    messageTitle: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
        marginBottom: 10,
    },
    messageText: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    buttonPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    buttonText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
});
