import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Calendar } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

interface SummaryCardsProps {
    filteredTotalEntries: number;
}

export default function SummaryCards({ filteredTotalEntries }: SummaryCardsProps) {
    const avgPerWeek = filteredTotalEntries > 0 ? Math.ceil(filteredTotalEntries / 4) : 0;

    return (
        <View style={styles.container}>
            <PixelCard padding={16} wrapperStyle={styles.cardWrapper} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                    <TrendingUp size={18} color="#4F46E5" strokeWidth={3} />
                </View>
                <Text style={styles.summaryNumber}>{filteredTotalEntries}</Text>
                <Text style={styles.summaryLabel}>TOTAL</Text>
                <Text style={styles.summaryLabel}>JOURNALS</Text>
            </PixelCard>

            <PixelCard padding={16} wrapperStyle={styles.cardWrapper} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Calendar size={18} color="#166534" strokeWidth={3} />
                </View>
                <Text style={styles.summaryNumber}>{avgPerWeek}</Text>
                <Text style={styles.summaryLabel}>AVG</Text>
                <Text style={styles.summaryLabel}>/ WEEK</Text>
            </PixelCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
        marginTop: 6,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        alignItems: 'center',
    },
    iconBox: {
        // Square and outlined -- the 18px radius this used to carry was the only
        // round corner left on the screen.
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        marginBottom: 10,
    },
    summaryNumber: {
        fontSize: 26,
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
    summaryLabel: {
        // Split across two lines by the caller: Silkscreen is wide enough that
        // "TOTAL JOURNALS" on one line overflows a half-width card.
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
        marginTop: 3,
    },
});
