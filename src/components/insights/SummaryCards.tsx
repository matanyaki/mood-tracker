import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Smile, ArrowUp, ArrowDown, Minus } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

/**
 * Mood score points against last month. 'new' when last month had nothing to
 * score, null while last month is loading (or failed) or this month is empty.
 */
export type MoodDelta = number | 'new' | null;

interface SummaryCardsProps {
    filteredTotalEntries: number;
    /** 0-100, or null for a month with nothing to score. */
    moodScore: number | null;
    delta: MoodDelta;
}

export default function SummaryCards({ filteredTotalEntries, moodScore, delta }: SummaryCardsProps) {
    // A decline is drawn muted, not red: a down month is not something to be
    // told off for.
    const deltaColor = typeof delta === 'number' && delta < 0 ? INK_MUTED : INK;

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
                    <Smile size={18} color="#166534" strokeWidth={3} />
                </View>
                <View style={styles.numberRow}>
                    <Text style={styles.summaryNumber}>{moodScore ?? '—'}</Text>
                    {delta === 'new' && (
                        <Text style={[styles.deltaText, { color: INK_MUTED }]}>NEW</Text>
                    )}
                    {typeof delta === 'number' && (
                        // Arrows as icons: Silkscreen has no glyph for them. An
                        // unchanged month gets a dash, so "no change" still reads
                        // as an answer rather than a missing one.
                        <View style={styles.delta}>
                            {delta > 0 && <ArrowUp size={12} color={deltaColor} strokeWidth={3} />}
                            {delta < 0 && <ArrowDown size={12} color={deltaColor} strokeWidth={3} />}
                            {delta === 0 && <Minus size={12} color={INK_MUTED} strokeWidth={3} />}
                            <Text style={[styles.deltaText, { color: delta === 0 ? INK_MUTED : deltaColor }]}>
                                {Math.abs(delta)} PTS
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.summaryLabel}>MOOD</Text>
                <Text style={styles.summaryLabel}>SCORE</Text>
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
    numberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryNumber: {
        fontSize: 26,
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
    delta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    deltaText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
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
