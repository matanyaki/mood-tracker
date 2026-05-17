import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Droplets } from 'lucide-react-native';
import Card from '../../components/Card';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';

const screenWidth = Dimensions.get('window').width;

interface EmotionWavesChartProps {
    chartData: any;
    handleDataPointClick: (data: any) => void;
    isFetching?: boolean;
    hasData?: boolean;
}

export default function EmotionWavesChart({ chartData, handleDataPointClick, isFetching, hasData = true }: EmotionWavesChartProps) {
    const [isolatedEmotion, setIsolatedEmotion] = useState<string | null>(null);

    // Process chart data to handle opacity for isolated emotion
    const processedChartData = {
        ...chartData,
        datasets: chartData.datasets.map((ds: any) => {
            const isFaded = isolatedEmotion && ds.emotionKey !== isolatedEmotion;
            
            // Helper to add opacity to a hex color
            const hexToRgba = (hex: string, op: number) => {
                let r = parseInt(hex.slice(1, 3), 16) || 0,
                    g = parseInt(hex.slice(3, 5), 16) || 0,
                    b = parseInt(hex.slice(5, 7), 16) || 0;
                return `rgba(${r}, ${g}, ${b}, ${op})`;
            };

            const hexColor = getEmotionColor(ds.emotionKey);
            const lineOpacity = isFaded ? 0.15 : 1;
            
            return {
                ...ds,
                color: () => hexToRgba(hexColor, lineOpacity),
                strokeWidth: isFaded ? 1 : 2, // Thinner lines if faded
            };
        })
    };

    if (!hasData && !isFetching) {
        return (
            <Card padding={24} borderRadius={24} style={styles.emptyCard}>
                <Droplets size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>The waters are calm</Text>
                <Text style={styles.emptyText}>You haven't logged any emotions this month yet. Take a moment to reflect and start shaping your waves.</Text>
            </Card>
        );
    }

    return (
        <Card padding={10} borderRadius={24} style={[styles.chartCard, { marginHorizontal: -15 }]}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.chartTitle}>Emotion Island Waves</Text>
                    <Text style={styles.chartSubtitle}>Y: Stacked Intensity | X: Day of Month</Text>
                </View>
                {isFetching && (
                    <ActivityIndicator size="small" color="#4F46E5" style={styles.fetchingIndicator} />
                )}
            </View>

            <View style={{ opacity: isFetching ? 0.7 : 1 }}>
                <LineChart
                    data={processedChartData}
                    width={screenWidth - 10} // Adjust width to account for wider negative margins
                    height={350}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1}
                    yLabelsOffset={5}
                    fromZero={true}
                    segments={3} // 3 dashed horizontal guide lines
                    withVerticalLines={false} // Clean up background grid
                    withHorizontalLines={true}
                    withOuterLines={false} // Remove y-axis spine
                    chartConfig={{
                        backgroundColor: "transparent",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        backgroundGradientFromOpacity: 0,
                        backgroundGradientToOpacity: 0,
                        decimalPlaces: 0,
                        useShadowColorFromDataset: true, // This makes the area fill use the dataset's color
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                        fillShadowGradientFromOpacity: 0.8, // 80% opacity on filled areas
                        fillShadowGradientToOpacity: 0.75, // 75% opacity bottom
                        propsForBackgroundLines: {
                            strokeDasharray: "4 4",
                            strokeWidth: 1,
                            stroke: "rgba(200, 200, 200, 0.3)"
                        },
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: "12", // Large hit target for interactivity
                            strokeWidth: "0",
                            fill: "rgba(0,0,0,0)" // Invisible points!
                        }
                    }}
                    bezier // Smooth curves, never jagged lines
                    style={{
                        marginVertical: 8,
                        borderRadius: 16,
                    }}
                    onDataPointClick={handleDataPointClick}
                />
            </View>
            <Text style={styles.tapHint}>Tap anywhere on the waves for details</Text>

            {/* Custom Stylized Legend - Placed BELOW chart */}
            <View style={styles.legendContainer}>
                {EMOTIONS_CONFIG.map(e => {
                    const isFaded = isolatedEmotion && isolatedEmotion !== e.id;
                    return (
                        <TouchableOpacity 
                            key={e.id} 
                            style={styles.legendItem} 
                            onPress={() => setIsolatedEmotion(isolatedEmotion === e.id ? null : e.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.legendSquare, { backgroundColor: getEmotionColor(e.id), opacity: isFaded ? 0.2 : 1 }]} />
                            <Text style={[styles.legendText, { opacity: isFaded ? 0.5 : 1 }]}>{e.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        marginBottom: 10,
        alignItems: 'center'
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
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginTop: 5,
        marginBottom: 2
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 10
    },
    tapHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: -10,
        marginBottom: 10,
        fontStyle: 'italic'
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
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
        color: '#4B5563',
        fontWeight: '500',
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        marginBottom: 20,
        marginHorizontal: -15,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed'
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20
    }
});
