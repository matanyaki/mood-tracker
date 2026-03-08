import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../../components/Card';
import { TrendingUp, Calendar } from 'lucide-react-native';

interface SummaryCardsProps {
    filteredTotalEntries: number;
}

export default function SummaryCards({ filteredTotalEntries }: SummaryCardsProps) {
    const avgPerWeek = filteredTotalEntries > 0 ? Math.ceil(filteredTotalEntries / 4) : 0;

    return (
        <View style={styles.container}>
            <Card padding={16} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                    <TrendingUp size={20} color="#4F46E5" />
                </View>
                <Text style={styles.summaryNumber}>{filteredTotalEntries}</Text>
                <Text style={styles.summaryLabel}>Total Journals</Text>
            </Card>

            <Card padding={16} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Calendar size={20} color="#166534" />
                </View>
                <Text style={styles.summaryNumber}>{avgPerWeek}</Text>
                <Text style={styles.summaryLabel}>Avg / Week</Text>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
        marginTop: 10
    },
    card: {
        flex: 1,
        alignItems: 'center'
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8
    },
    summaryNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    summaryLabel: {
        fontSize: 16,
        color: '#4A4A4A',
        marginTop: 2,
        fontWeight: '600',
    }
});
