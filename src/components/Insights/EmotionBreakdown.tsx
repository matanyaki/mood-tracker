import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import Card from '../../components/Card';

interface EmotionStat {
    label: string;
    count: number;
    color: string;
    percentage: number;
}

interface EmotionBreakdownProps {
    stats: EmotionStat[];
}

export default function EmotionBreakdown({ stats }: EmotionBreakdownProps) {
    return (
        <>
            <View style={styles.sectionHeader}>
                <BarChart3 size={20} color="#1A202C" />
                <Text style={styles.sectionTitle}>Emotion Breakdown</Text>
            </View>

            <Card padding={20} borderRadius={24}>
                {stats.length > 0 ? (
                    stats.map((item, index) => (
                        <View key={item.label} style={[styles.statRow, index === stats.length - 1 && styles.lastStatRow]}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.statLabel}>{item.label}</Text>
                                <Text style={styles.statCount}>{item.count} times</Text>
                            </View>
                            <View style={styles.barBackground}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${item.percentage}%`, backgroundColor: item.color }
                                    ]}
                                />
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 10 }}>
                        No entries matching filter
                    </Text>
                )}
            </Card>
        </>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    statRow: {
        marginBottom: 20,
    },
    lastStatRow: {
        marginBottom: 0,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    statCount: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '600',
    },
    barBackground: {
        height: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    }
});
