import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import PixelCard from '../ui/PixelCard';
import { CARD_GAP, CARD_PADDING, SPACE } from '../../constants/layout';

/** The goal accent GoalCard draws its bar in, greyed for a placeholder. */
const PLACEHOLDER_ACCENT = '#CBD5E1';

/**
 * Two GoalCard-shaped placeholders: name, date line, the week of day pips and the
 * times line, at the heights the real card draws them.
 *
 * Replaces the spinner GoalsScreen used to show -- every other list in the app
 * loads behind a skeleton of its own shape.
 */
export default function GoalListSkeleton() {
    return (
        <View style={styles.list}>
            {[0, 1].map(i => (
                <PixelCard key={i} padding={CARD_PADDING} accentColor={PLACEHOLDER_ACCENT} style={styles.card}>
                    <SkeletonBox width="60%" height={16} borderRadius={0} />
                    <SkeletonBox width="70%" height={12} borderRadius={0} />
                    <View style={styles.week}>
                        {Array.from({ length: 7 }, (_, d) => (
                            <SkeletonBox key={d} width={20} height={20} borderRadius={0} />
                        ))}
                    </View>
                    <SkeletonBox width="40%" height={12} borderRadius={0} />
                </PixelCard>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: CARD_GAP,
    },
    card: {
        gap: SPACE.sm,
    },
    week: {
        flexDirection: 'row',
        gap: SPACE.xs,
    },
});
