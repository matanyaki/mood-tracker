import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '../Card';
import SkeletonBox from './SkeletonBox';

// EmotionBreakdown renders one row per emotion with a count > 0. Four is the
// typical first paint for a month of entries.
const BREAKDOWN_ROWS = [0, 1, 2, 3];
const LEGEND_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 9 emotions in EMOTIONS_CONFIG

/**
 * Stands in for the three stat blocks on InsightsScreen while entries and
 * stats load: EmotionWavesChart, SummaryCards and EmotionBreakdown.
 *
 * Renders bare (no ScreenContainer / ScrollView): InsightsScreen keeps its
 * real AppHeader and FilterRow mounted above it, so the month/year pickers
 * stay usable while the stats below them load.
 */
export default function InsightsStatsSkeleton() {
    return (
        <>
            {/* EmotionWavesChart card */}
            <Card padding={12} borderRadius={24} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <SkeletonBox width={170} height={18} borderRadius={5} />
                    <SkeletonBox
                        width={210}
                        height={12}
                        borderRadius={4}
                        style={styles.chartSubtitle}
                    />
                </View>

                <SkeletonBox height={350} borderRadius={16} style={styles.chartBody} />

                <View style={styles.legendContainer}>
                    {LEGEND_ITEMS.map(i => (
                        <View key={`legend-${i}`} style={styles.legendItem}>
                            <SkeletonBox width={10} height={10} borderRadius={2} />
                            <SkeletonBox width={54} height={13} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </Card>

            {/* SummaryCards: two cards, gap 20, marginTop 10, marginBottom 24 */}
            <View style={styles.summaryContainer}>
                {[0, 1].map(i => (
                    <Card key={`summary-${i}`} padding={16} style={styles.summaryCard}>
                        <SkeletonBox
                            width={36}
                            height={36}
                            borderRadius={18}
                            style={styles.summaryIcon}
                        />
                        <SkeletonBox width={44} height={28} borderRadius={6} />
                        <SkeletonBox
                            width={100}
                            height={16}
                            borderRadius={4}
                            style={styles.summaryLabel}
                        />
                    </Card>
                ))}
            </View>

            {/* EmotionBreakdown card */}
            <Card padding={20} borderRadius={24} elevation={0} style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                    <SkeletonBox width={165} height={18} borderRadius={5} />
                    <SkeletonBox
                        width={240}
                        height={13}
                        borderRadius={4}
                        style={styles.breakdownSubtitle}
                    />
                </View>

                <View style={styles.rowsContainer}>
                    {BREAKDOWN_ROWS.map(i => (
                        <View key={`breakdown-${i}`}>
                            <View style={styles.breakdownTopRow}>
                                <View style={styles.leftGroup}>
                                    <SkeletonBox width={25} height={25} borderRadius={6} />
                                    <SkeletonBox width={72} height={15} borderRadius={4} />
                                </View>
                                <View style={styles.rightGroup}>
                                    <SkeletonBox width={30} height={13} borderRadius={4} />
                                    <SkeletonBox width={30} height={18} borderRadius={8} />
                                </View>
                            </View>
                            <SkeletonBox height={4} borderRadius={2} />
                        </View>
                    ))}
                </View>
            </Card>
        </>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        marginBottom: 10,
        marginHorizontal: -15,
        alignItems: 'center',
        minHeight: 220,
    },
    chartHeader: {
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 5,
    },
    chartSubtitle: {
        marginTop: 4,
        marginBottom: 10,
    },
    chartBody: {
        marginVertical: 8,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginVertical: 12,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
        marginTop: 10,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
    },
    summaryIcon: {
        marginBottom: 8,
    },
    summaryLabel: {
        marginTop: 4,
    },
    breakdownCard: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    breakdownHeader: {
        marginBottom: 16,
    },
    breakdownSubtitle: {
        marginTop: 4,
    },
    rowsContainer: {
        gap: 12,
    },
    breakdownTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
});
