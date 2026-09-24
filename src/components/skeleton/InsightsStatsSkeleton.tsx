import React from 'react';
import { View, StyleSheet } from 'react-native';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from './SkeletonBox';
import { getEmotionColor } from '../../constants/colors';
import { OUTLINE, PAPER, BORDER_W_INNER } from '../../constants/pixel';

// MonthlyReassurance's fill, off the same taxonomy entry the card takes it from.
// The one skeleton block that carries colour: it stands in for the only filled
// card on the screen, and a paper one would flash green when the month lands.
const REASSURANCE_ACCENT = getEmotionColor('calm');

// EmotionBreakdown renders one row per emotion with a count > 0. Four is the
// typical first paint for a month of entries.
const BREAKDOWN_ROWS = [0, 1, 2, 3];
const LEGEND_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 9 emotions in EMOTIONS_CONFIG

// Every box is square-cornered: a rounded placeholder that resolves into a
// pixel card announces the wrong shape for the half second it is up.
const SQUARE = 0;

/**
 * Stands in for the three stat blocks on InsightsScreen while entries and
 * stats load: EmotionWavesChart, SummaryCards and EmotionBreakdown.
 *
 * Renders bare (no ScreenContainer / ScrollView): InsightsScreen keeps its
 * real AppHeader and FilterRow mounted above it, so the month/year chips
 * stay usable while the stats below them load.
 */
export default function InsightsStatsSkeleton() {
    return (
        <>
            {/* MonthlyReassurance card */}
            <PixelCard padding={16} wrapperStyle={styles.reassuranceCardWrapper} style={styles.reassuranceCard}>
                <View style={styles.reassuranceHeader}>
                    <View style={styles.reassuranceFaceBox}>
                        <SkeletonBox width={28} height={28} borderRadius={SQUARE} />
                    </View>
                    <View style={styles.reassuranceHeaderText}>
                        <SkeletonBox width={130} height={13} borderRadius={SQUARE} />
                        <SkeletonBox
                            width={140}
                            height={10}
                            borderRadius={SQUARE}
                            style={styles.reassuranceSubtitle}
                        />
                    </View>
                </View>

                {/* Three lines: what the shortest of the card's sentences wraps to. */}
                <View style={styles.reassurancePanel}>
                    <SkeletonBox height={12} borderRadius={SQUARE} />
                    <SkeletonBox height={12} borderRadius={SQUARE} style={styles.reassuranceLine} />
                    <SkeletonBox width="60%" height={12} borderRadius={SQUARE} style={styles.reassuranceLine} />
                </View>

                <View style={styles.reassuranceStamps}>
                    <SkeletonBox width={74} height={10} borderRadius={SQUARE} />
                    <SkeletonBox width={90} height={10} borderRadius={SQUARE} />
                </View>
            </PixelCard>

            {/* EmotionWavesChart card */}
            <PixelCard padding={0} wrapperStyle={styles.chartCardWrapper} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <SkeletonBox width={170} height={13} borderRadius={SQUARE} />
                    <SkeletonBox
                        width={150}
                        height={9}
                        borderRadius={SQUARE}
                        style={styles.chartSubtitle}
                    />
                </View>

                <SkeletonBox height={320} borderRadius={SQUARE} style={styles.chartBody} />

                <View style={styles.legendContainer}>
                    {LEGEND_ITEMS.map(i => (
                        <View key={`legend-${i}`} style={styles.legendItem}>
                            <SkeletonBox width={10} height={10} borderRadius={SQUARE} />
                            <SkeletonBox width={48} height={9} borderRadius={SQUARE} />
                        </View>
                    ))}
                </View>
            </PixelCard>

            {/* SummaryCards: two cards side by side */}
            <View style={styles.summaryContainer}>
                {[0, 1].map(i => (
                    <PixelCard
                        key={`summary-${i}`}
                        padding={16}
                        wrapperStyle={styles.summaryCardWrapper}
                        style={styles.summaryCard}
                    >
                        <SkeletonBox
                            width={34}
                            height={34}
                            borderRadius={SQUARE}
                            style={styles.summaryIcon}
                        />
                        <SkeletonBox width={40} height={26} borderRadius={SQUARE} />
                        <SkeletonBox
                            width={60}
                            height={10}
                            borderRadius={SQUARE}
                            style={styles.summaryLabel}
                        />
                        <SkeletonBox width={72} height={10} borderRadius={SQUARE} style={styles.summaryLabel} />
                    </PixelCard>
                ))}
            </View>

            {/* EmotionBreakdown card */}
            <PixelCard padding={18} wrapperStyle={styles.breakdownCardWrapper}>
                <View style={styles.breakdownHeader}>
                    <SkeletonBox width={165} height={13} borderRadius={SQUARE} />
                    <SkeletonBox
                        width={200}
                        height={10}
                        borderRadius={SQUARE}
                        style={styles.breakdownSubtitle}
                    />
                </View>

                <View style={styles.rowsContainer}>
                    {BREAKDOWN_ROWS.map(i => (
                        <View key={`breakdown-${i}`}>
                            <View style={styles.breakdownTopRow}>
                                <View style={styles.leftGroup}>
                                    <SkeletonBox width={24} height={24} borderRadius={SQUARE} />
                                    <SkeletonBox width={72} height={12} borderRadius={SQUARE} />
                                </View>
                                <View style={styles.rightGroup}>
                                    <SkeletonBox width={28} height={11} borderRadius={SQUARE} />
                                    <SkeletonBox width={30} height={18} borderRadius={SQUARE} />
                                </View>
                            </View>
                            <SkeletonBox height={14} borderRadius={SQUARE} />
                        </View>
                    ))}
                </View>
            </PixelCard>
        </>
    );
}

const styles = StyleSheet.create({
    // Mirrors MonthlyReassurance: filled face, outlined face box, paper panel.
    reassuranceCardWrapper: {
        marginBottom: 20,
    },
    reassuranceCard: {
        backgroundColor: REASSURANCE_ACCENT,
    },
    reassuranceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    reassuranceFaceBox: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    reassuranceHeaderText: {
        flex: 1,
    },
    reassuranceSubtitle: {
        marginTop: 6,
    },
    reassurancePanel: {
        padding: 12,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    reassuranceLine: {
        marginTop: 8,
    },
    reassuranceStamps: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    chartCardWrapper: {
        marginBottom: 20,
    },
    chartCard: {
        alignItems: 'center',
        minHeight: 220,
    },
    chartHeader: {
        width: '100%',
        padding: 14,
        paddingBottom: 12,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    chartSubtitle: {
        marginTop: 6,
    },
    chartBody: {
        marginVertical: 10,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 14,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
        marginBottom: 20,
    },
    summaryCardWrapper: {
        flex: 1,
    },
    summaryCard: {
        alignItems: 'center',
    },
    summaryIcon: {
        marginBottom: 10,
    },
    summaryLabel: {
        marginTop: 3,
    },
    breakdownCardWrapper: {
        marginBottom: 24,
    },
    breakdownHeader: {
        paddingBottom: 12,
        marginBottom: 16,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    breakdownSubtitle: {
        marginTop: 6,
    },
    rowsContainer: {
        gap: 16,
    },
    breakdownTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
