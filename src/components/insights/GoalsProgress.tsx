import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { GoalProgress } from '@shared/types';
import PixelCard from '../ui/PixelCard';
import EmptyState from '../ui/EmptyState';
import SkeletonBox from '../skeleton/SkeletonBox';
import PixelProgressRing from './PixelProgressRing';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SPACE } from '../../constants/layout';
import { OUTLINE, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

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
            <EmptyState
                bare
                title="COULD NOT LOAD"
                subtitle="Your goals could not be loaded."
                buttonLabel="[ TRY AGAIN ]"
                onButtonPress={onRetry}
            />
        );
    } else if (goals.length === 0) {
        body = (
            <EmptyState
                bare
                title="NO GOALS YET"
                subtitle="Add a goal to see how far along it is."
                buttonLabel="[ ADD A GOAL ]"
                onButtonPress={onAddGoal}
            />
        );
    } else {
        body = (
            <View style={styles.grid}>
                {goals.map(goal => (
                    <View
                        key={goal.goalId}
                        style={[styles.cell, { width: columnWidth }]}
                        accessible
                        accessibilityLabel={`${goal.name}${goal.paused ? ', paused' : ''}: ${goal.completed} of ${goal.target} days done, ${goal.percent} percent`}
                    >
                        <Text style={styles.goalName} numberOfLines={1}>
                            {goal.name.toUpperCase()}
                        </Text>
                        <PixelProgressRing percent={goal.percent} />
                        <Text style={styles.count}>
                            {goal.completed} / {goal.target}
                        </Text>
                        {/* A paused goal keeps its ring and its target -- the days
                            left wait for the resume -- but says it is not running. */}
                        {goal.paused && <Text style={styles.pausedTag}>PAUSED</Text>}
                    </View>
                ))}
            </View>
        );
    }

    return (
        <PixelCard padding={CARD_PADDING}>
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
    cardHeader: {
        paddingBottom: SPACE.md,
        marginBottom: SPACE.lg,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    cardTitle: {
        ...TYPE.h3,
    },
    cardSubtitle: {
        ...TYPE.caption,
        marginTop: SPACE.xs,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: SPACE.lg,
    },
    cell: {
        alignItems: 'center',
        paddingHorizontal: SPACE.xs,
    },
    goalName: {
        // Stretched to the cell so a long name truncates inside its column instead
        // of sizing itself wider than the column it is centred in.
        alignSelf: 'stretch',
        textAlign: 'center',
        ...TYPE.label,
        letterSpacing: 0.5,
        marginBottom: SPACE.sm,
    },
    count: {
        ...TYPE.caption,
        marginTop: SPACE.sm,
    },
    pausedTag: {
        ...TYPE.label,
        color: INK_MUTED,
        marginTop: SPACE.xs,
    },
});
