import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { TrendingUp, Smile, ArrowUp, ArrowDown, Minus, Info } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import { getEmotionColor } from '../../constants/colors';
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

/**
 * What goes into the score, in words rather than the formula. Each row maps to
 * one step of monthlyMoodScore / scoreDay in MonthlyReassurance -- including the
 * caps on the day and goal points -- so if those change, this has to too. The
 * swatch only decorates the row.
 */
const SCORE_FACTORS = [
    {
        title: 'WHAT YOU FELT',
        body: 'Pleasant feelings like happy, excited and calm lift it. Heavier ones like sad, anxious or angry bring it down.',
        swatch: getEmotionColor('happy'),
    },
    {
        title: 'HOW STRONGLY',
        body: 'A feeling logged at a higher intensity counts for more than a light one.',
        swatch: getEmotionColor('excited'),
    },
    {
        title: 'EVERY DAY EQUALLY',
        body: "Each day you journal counts once, however many entries it holds, so one busy day can't outweigh the rest.",
        swatch: getEmotionColor('calm'),
    },
    {
        title: 'SHOWING UP',
        body: 'Each day you check in adds a point, and each day that passes without one takes a point off, up to 10 either way.',
        swatch: getEmotionColor('confused'),
    },
    {
        title: 'GOALS',
        body: 'Each goal day you complete adds a point, up to 3 a month. A small bonus: the score is mostly about how you felt.',
        swatch: getEmotionColor('tired'),
    },
    {
        title: 'THE ARROW',
        body: 'Shows how this month compares with last month.',
        swatch: getEmotionColor('sad'),
    },
];

export default function SummaryCards({ filteredTotalEntries, moodScore, delta }: SummaryCardsProps) {
    const [explainerVisible, setExplainerVisible] = useState(false);

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

            <Pressable
                onPress={() => setExplainerVisible(true)}
                style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Mood score ${moodScore ?? 'not available'}. Tap to see how it is worked out.`}
            >
                <PixelCard padding={16} wrapperStyle={styles.fill} style={[styles.card, styles.fill]}>
                    {/* The only hint the card is tappable -- the face is otherwise
                        drawn the same as the journals card beside it. */}
                    <View style={styles.infoBadge} pointerEvents="none">
                        <Info size={14} color={INK_MUTED} strokeWidth={2.5} />
                    </View>

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
            </Pressable>

            <Modal
                visible={explainerVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setExplainerVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setExplainerVisible(false)}>
                    <PixelCard padding={0} wrapperStyle={styles.dialog}>
                        <View style={styles.dialogHeader}>
                            <Text style={styles.dialogTitle}>YOUR MOOD SCORE</Text>
                            <Text style={styles.dialogSubtitle}>
                                A 0-100 snapshot of how your month has felt
                            </Text>
                        </View>

                        <View style={styles.dialogBody}>
                            {SCORE_FACTORS.map(factor => (
                                <View key={factor.title} style={styles.factor}>
                                    <View style={[styles.swatch, { backgroundColor: factor.swatch }]} />
                                    <View style={styles.factorText}>
                                        <Text style={styles.factorTitle}>{factor.title}</Text>
                                        <Text style={styles.factorBody}>{factor.body}</Text>
                                    </View>
                                </View>
                            ))}

                            {/* Said outright because a number out of 100 reads as a
                                mark, and a low one would read as a fail. */}
                            <View style={styles.note}>
                                <Text style={styles.noteText}>
                                    {"Around 50 is a balanced month. It's a snapshot, not a grade."}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>[ TAP ANYWHERE TO CLOSE ]</Text>
                        </View>
                    </PixelCard>
                </Pressable>
            </Modal>
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
    cardPressed: {
        opacity: 0.85,
    },
    fill: {
        // Keeps the tappable card the same height as the plain one beside it.
        flex: 1,
    },
    card: {
        alignItems: 'center',
    },
    infoBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
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
    // Explainer dialog -- the same frame as ChartTooltipModal and PixelAlert.
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dialog: {
        width: '100%',
        maxWidth: 340,
    },
    dialogHeader: {
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
    },
    dialogTitle: {
        fontSize: 15,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
        marginBottom: 6,
    },
    dialogSubtitle: {
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    dialogBody: {
        padding: 18,
        gap: 14,
    },
    factor: {
        flexDirection: 'row',
        gap: 10,
    },
    swatch: {
        width: 12,
        height: 12,
        marginTop: 2,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    factorText: {
        flex: 1,
    },
    factorTitle: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
        marginBottom: 4,
    },
    factorBody: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 16,
    },
    note: {
        paddingTop: 12,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
    },
    noteText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        lineHeight: 16,
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
    },
    footerText: {
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
});
