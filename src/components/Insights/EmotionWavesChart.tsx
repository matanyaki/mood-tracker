import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Card from '../../components/Card';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';

const screenWidth = Dimensions.get('window').width;

interface EmotionWavesChartProps {
    chartData: any;
    handleDataPointClick: (data: any) => void;
}

export default function EmotionWavesChart({ chartData, handleDataPointClick }: EmotionWavesChartProps) {
    return (
        <Card padding={10} borderRadius={24} style={[styles.chartCard, { marginHorizontal: -15 }]}>
            <Text style={styles.chartTitle}>Emotion Island Waves</Text>
            <Text style={styles.chartSubtitle}>Y: Intensity (0-5) | X: Day of Month</Text>

            {/* Custom Stylized Legend */}
            <View style={styles.legendContainer}>
                {EMOTIONS_CONFIG.map(e => (
                    <View key={e.id} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: getEmotionColor(e.id) }]} />
                        <Text style={styles.legendText}>{e.label}</Text>
                    </View>
                ))}
            </View>

            <LineChart
                data={chartData}
                width={screenWidth - 10} // Adjust width to account for wider negative margins
                height={350}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1}
                yLabelsOffset={5}
                fromZero={true}
                segments={5}
                withVerticalLines={false} // Clean up background grid
                chartConfig={{
                    backgroundColor: "transparent",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    backgroundGradientFromOpacity: 0, // Removes the double white card background
                    backgroundGradientToOpacity: 0,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                    fillShadowGradientFromOffset: 1, // Enhances area fill rendering
                    style: {
                        borderRadius: 16
                    },
                    propsForDots: {
                        r: "6", // Enlarged to look like clickable buttons
                        strokeWidth: "3",
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                    borderRadius: 16,
                }}
                onDataPointClick={handleDataPointClick}
            />
            <Text style={styles.tapHint}>Tap on any data point &gt; 0 for details</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        marginBottom: 10,
        alignItems: 'center'
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
        marginTop: 4,
        fontStyle: 'italic'
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginVertical: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    }
});
