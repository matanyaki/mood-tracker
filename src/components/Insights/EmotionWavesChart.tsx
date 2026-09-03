import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Droplets } from 'lucide-react-native';
import Card from '../../components/Card';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';

const screenWidth = Dimensions.get('window').width;

// Strongly type the chart dataset and data contract
export interface ChartDataset {
    emotionKey: string;
    color?: (opacity?: number) => string;
    data: number[];
    strokeWidth?: number;
    meta?: { scale: number; note: string }[];
    withDots?: boolean;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

interface EmotionWavesChartProps {
    chartData: ChartData;
    handleDataPointClick: (data: any) => void;
    isFetching?: boolean;
    hasData?: boolean;
}

export default function EmotionWavesChart({ chartData, handleDataPointClick, isFetching, hasData = true }: EmotionWavesChartProps) {
    const CARD_HORIZONTAL_MARGIN = 30;
    const CARD_HORIZONTAL_PADDING = 24;
    const chartWidth = screenWidth - CARD_HORIZONTAL_MARGIN - CARD_HORIZONTAL_PADDING;

    const processedData = useMemo(() => {
        if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
            return {
                labels: [],
                datasets: [],
                dominantEmotions: [],
                dayHasEntry: [],
                totalDataPoints: 0,
                hasValidData: false,
                activeEmotions: []
            };
        }

        const labels = chartData.labels || [];
        const numDays = labels.length;

        const peakIntensities = Array(numDays).fill(1); // default to 1 so the wave doesn't collapse below the grid
        const dominantEmotions = Array(numDays).fill('');
        const dayHasEntry = Array(numDays).fill(false);
        let totalDataPoints = 0;

        for (let i = 0; i < numDays; i++) {
            let maxVal = 0;
            let dominantKey = '';
            chartData.datasets.forEach(ds => {
                const val = ds.data[i];
                if (typeof val === 'number' && !isNaN(val) && val > maxVal) {
                    maxVal = val;
                    dominantKey = ds.emotionKey;
                }
            });
            if (maxVal > 0) {
                peakIntensities[i] = maxVal;
                dominantEmotions[i] = dominantKey;
                dayHasEntry[i] = true;
                totalDataPoints++;
            }
        }

        // Filter X-axis labels: show exactly 1, 7, 14, 21, 28 as days of the month
        const displayLabels = labels.map((label, index) => {
            const dayNum = parseInt(label.replace(/\D/g, ''), 10);
            const isMatch = dayNum === 1 || dayNum === 7 || dayNum === 14 || dayNum === 21 || dayNum === 28 ||
                            index === 0 || index === 6 || index === 13 || index === 20 || index === 27;
            return isMatch ? label : '';
        });

        // Fixed indigo rgba(79, 70, 229, opacity) for line itself
        const datasets: ChartDataset[] = [
            {
                emotionKey: 'aggregated_wave',
                data: peakIntensities,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                strokeWidth: 2,
            },
            // Dummy dataset to force the Y-axis range to be 1 to 5
            {
                emotionKey: 'y_bounds_dummy',
                data: numDays >= 2 ? [1, 5, ...Array(numDays - 2).fill(1)] : [1, 5],
                color: (opacity = 1) => 'rgba(0, 0, 0, 0)',
                strokeWidth: 0,
                withDots: false
            }
        ];

        // Filter EMOTIONS_CONFIG to only include emotions that have at least one value > 0 in chartData.datasets for current month
        const activeEmotions = EMOTIONS_CONFIG.filter(e =>
            chartData.datasets.some(ds =>
                ds.emotionKey === e.id && ds.data.some(v => v > 0)
            )
        );

        return {
            labels: displayLabels,
            datasets,
            dominantEmotions,
            dayHasEntry,
            totalDataPoints,
            hasValidData: totalDataPoints > 0,
            activeEmotions
        };
    }, [chartData]);

    const showEmptyState = !hasData || !processedData.hasValidData;

    if (showEmptyState) {
        return (
            <Card padding={24} borderRadius={24} style={styles.emptyCard}>
                <Droplets size={44} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No waves yet</Text>
                <Text style={styles.emptyText}>Start journaling to see your emotion wave take shape.</Text>
            </Card>
        );
    }

    return (
        <Card padding={12} borderRadius={24} style={[styles.chartCard, { marginHorizontal: -15, paddingHorizontal: 0 }]}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.chartTitle}>Emotion Wave Chart</Text>
                    <Text style={styles.chartSubtitle}>Y: Intensity (1-5) | X: Day of Month</Text>
                </View>
                {isFetching && (
                    <ActivityIndicator size="small" color="#4F46E5" style={styles.fetchingIndicator} />
                )}
            </View>

            {processedData.totalDataPoints === 1 && (
                <Text style={styles.singleEntryHint}>
                    Keep journaling — your wave forms with more entries
                </Text>
            )}

            <View style={{ opacity: isFetching ? 0.7 : 1, overflow: 'hidden', borderRadius: 20 }}>
                <LineChart
                    data={processedData}
                    width={chartWidth}
                    height={350}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1}
                    yLabelsOffset={5}
                    fromZero={false}
                    segments={4}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withOuterLines={false}
                    chartConfig={{
                        backgroundColor: "transparent",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        backgroundGradientFromOpacity: 0,
                        backgroundGradientToOpacity: 0,
                        decimalPlaces: 0,
                        useShadowColorFromDataset: true,
                        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                        fillShadowGradientFromOpacity: 0.10,
                        fillShadowGradientToOpacity: 0.01,
                        propsForBackgroundLines: {
                            strokeDasharray: "4 4",
                            strokeWidth: 1,
                            stroke: "rgba(200, 200, 200, 0.25)"
                        },
                        // The chart draws its axis labels as SVG text, so the pixel
                        // face has to be passed in here rather than via a style.
                        propsForLabels: {
                            fontFamily: PIXEL,
                            fontSize: 9, // Silkscreen is wide -- the default crowds the axis
                        },
                        style: {
                            borderRadius: 16
                        }
                    }}
                    bezier
                    getDotColor={(dataPoint, index) => {
                        const emotionKey = processedData.dominantEmotions[index];
                        return getEmotionColor(emotionKey) || '#4F46E5';
                    }}
                    getDotProps={(dataPoint, index) => {
                        const hasEntry = processedData.dayHasEntry[index];
                        if (hasEntry) {
                            return {
                                r: '5',
                                strokeWidth: '2',
                                stroke: '#ffffff',
                            };
                        } else {
                            return {
                                r: '0',
                            };
                        }
                    }}
                    style={{
                        marginVertical: 8,
                        borderRadius: 16,
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 12,
                        paddingRight: 40,
                    }}
                    onDataPointClick={handleDataPointClick}
                />
            </View>

            <View style={styles.legendContainer}>
                {EMOTIONS_CONFIG.map(e => (
                    <View key={e.id} style={styles.legendItem}>
                        <View style={[styles.legendSquare, { backgroundColor: getEmotionColor(e.id) }]} />
                        <Text style={styles.legendText}>{e.label}</Text>
                    </View>
                ))}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        marginBottom: 10,
        alignItems: 'center',
        minHeight: 220,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 10
    },
    fetchingIndicator: {
        marginTop: 5
    },
    chartTitle: {
        fontSize: 18,
        fontFamily: PIXEL_BOLD,
        color: '#1A1A2E',
        marginTop: 5,
        marginBottom: 2
    },
    chartSubtitle: {
        fontSize: 12,
        fontFamily: PIXEL,
        color: '#6B7280',
        marginBottom: 10
    },
    singleEntryHint: {
        fontSize: 12,
        fontFamily: PIXEL,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 10
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
    legendSquare: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 13,
        fontFamily: PIXEL,
        color: '#4B5563',
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        marginBottom: 10,
        marginHorizontal: -15,
        backgroundColor: '#ffffff',
        minHeight: 220,
    },
    emptyTitle: {
        fontSize: 17,
        fontFamily: PIXEL_BOLD,
        color: '#374151',
        marginTop: 12,
        marginBottom: 8
    },
    emptyText: {
        fontSize: 14,
        fontFamily: PIXEL,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20
    }
});
