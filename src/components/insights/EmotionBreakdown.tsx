import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import PixelCard from '../ui/PixelCard';
import SecondaryButton from '../ui/SecondaryButton';
import { getEmotionImageKey } from '../../../shared/types/emotions';
import { MOOD_IMAGES } from '../../constants/images';
import { darkInk } from '../../constants/colors';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, BORDER_W_INNER } from '../../constants/pixel';

export interface EmotionStat {
    id: string;
    label: string;
    color: string;
    /** Distinct days this emotion was logged on in the month. */
    daysFelt: number;
    /** Mean intensity on the 1-5 scale. */
    avgIntensity: number;
}

interface EmotionBreakdownProps {
    stats: EmotionStat[];
    /** Days in the month with anything logged -- the bar's denominator. */
    loggedDays: number;
}

/** Gutters drawn over the bar, which is what gives it its segmented meter look. */
const BAR_SEGMENTS = 10;
const SEGMENT_GUTTERS = Array.from({ length: BAR_SEGMENTS - 1 }, (_, i) => i);

/** Rows shown before SHOW ALL. */
const COLLAPSED_ROWS = 3;

/** The intensity scale's top, one pip per step. */
const MAX_INTENSITY = 5;
const PIPS = Array.from({ length: MAX_INTENSITY }, (_, i) => i);

const daysLabel = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

/**
 * One emotion: face and name, average intensity as a number and as pips, and a
 * meter for how many of the logged days it turned up on.
 */
const EmotionRowItem = ({ item, loggedDays }: { item: EmotionStat; loggedDays: number; key?: React.Key }) => {
    const reduceMotion = useReducedMotion();

    // The fill is laid out at full width and squashed horizontally, so the animated
    // value IS the fraction of the track to cover -- animating it re-targets from
    // wherever the bar currently sits, which is what makes a filter change slide
    // rather than jump.
    const fraction = loggedDays > 0 ? Math.max(0, Math.min(item.daysFelt / loggedDays, 1)) : 0;
    const scaleX = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Reduced motion: the bar takes its length immediately and fades in instead
        // of sweeping across the row -- travel distance 0, but still an animation.
        if (reduceMotion) {
            scaleX.setValue(fraction);
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
            return;
        }

        Animated.timing(scaleX, {
            toValue: fraction,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [fraction, reduceMotion, scaleX, fadeIn]);

    // An id outside the taxonomy resolves to no asset, so the row draws without
    // an emoji rather than throwing and taking the whole card down with it.
    const image = MOOD_IMAGES[getEmotionImageKey(item.id)];

    const avg = item.avgIntensity.toFixed(1);
    const filledPips = Math.round(item.avgIntensity);
    const daysText = `${item.daysFelt} of ${daysLabel(loggedDays)}`;

    return (
        // One stop for a screen reader: the pips and the bar are drawn numbers,
        // so the row reads them out as words instead.
        <View
            style={styles.rowContainer}
            accessible
            accessibilityLabel={`${item.label}: felt ${daysText}, average intensity ${avg} out of ${MAX_INTENSITY}`}
        >
            <View style={styles.topRow}>
                <View style={styles.leftGroup}>
                    {image && (
                        <Image
                            source={image}
                            style={styles.emotionImage}
                            resizeMode="contain"
                        />
                    )}
                    <Text style={[styles.labelText, { color: darkInk(item.color) }]}>
                        {item.label.toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.daysText}>{daysText}</Text>
            </View>

            {/* Segmented meter: share of logged days this emotion showed up on */}
            <View style={styles.progressBarTrack}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        {
                            backgroundColor: item.color,
                            opacity: reduceMotion ? fadeIn : 1,
                            transform: [{ scaleX }],
                        },
                    ]}
                />

                {/* Gutters sit ON TOP of the fill rather than dividing it, so the
                    animation stays one continuous scaleX on the native driver
                    while the bar still reads as discrete cells. */}
                <View style={styles.segmentOverlay} pointerEvents="none">
                    {SEGMENT_GUTTERS.map(i => (
                        <View key={i} style={styles.segmentGutter} />
                    ))}
                    <View style={styles.segmentCell} />
                </View>
            </View>

            {/* Intensity as pips and as a number, side by side under the bar */}
            <View style={styles.bottomRow}>
                <View style={styles.pipRow}>
                    {PIPS.map(i => (
                        <View
                            key={i}
                            style={[
                                styles.pip,
                                i < filledPips && { backgroundColor: item.color },
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.avgText}>avg {avg}</Text>
            </View>
        </View>
    );
};

export default function EmotionBreakdown({ stats = [], loggedDays }: EmotionBreakdownProps) {
    // No light/dark theming here any more: the pixel palette is a fixed set of
    // inks that every other surface in the app draws with, and a card that
    // swapped itself to navy would be the only one doing it.

    const [expanded, setExpanded] = useState(false);

    // Data filtering: skip emotions not felt on any day
    const activeStats = (stats || []).filter(item => item && item.daysFelt > 0);
    const hasActiveEmotions = activeStats.length > 0;

    // Rows arrive most-felt first, so the collapsed card is the month's top three.
    const canExpand = activeStats.length > COLLAPSED_ROWS;
    const shownStats = expanded ? activeStats : activeStats.slice(0, COLLAPSED_ROWS);

    return (
        <PixelCard padding={CARD_PADDING}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>EMOTION BREAKDOWN</Text>
                <Text style={styles.cardSubtitle}>
                    Days felt and average intensity this month
                </Text>
            </View>

            {/* Active Emotion Rows flat list (No valence sections) */}
            {hasActiveEmotions ? (
                <View style={styles.rowsContainer}>
                    {shownStats.map((row) => (
                        <EmotionRowItem key={row.id} item={row} loggedDays={loggedDays} />
                    ))}

                    {canExpand && (
                        <SecondaryButton
                            label={expanded ? 'SHOW LESS' : `SHOW ALL EMOTIONS (${activeStats.length})`}
                            onPress={() => setExpanded(e => !e)}
                            accessibilityState={{ expanded }}
                        />
                    )}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>NO ENTRIES MATCHING FILTER</Text>
                </View>
            )}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    cardHeader: {
        paddingBottom: SPACE.md,
        marginBottom: SPACE.lg,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    cardTitle: {
        ...TYPE.h3,
    },
    cardSubtitle: {
        ...TYPE.caption,
        marginTop: SPACE.xs,
    },
    rowsContainer: {
        gap: SPACE.lg,
    },
    rowContainer: {
        flexDirection: 'column',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACE.sm,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
    },
    emotionImage: {
        width: 28,
        height: 28,
    },
    labelText: {
        ...TYPE.label,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACE.xs,
    },
    pipRow: {
        flexDirection: 'row',
        gap: 3,
    },
    pip: {
        // Square and outlined like every other pixel block; the filled ones take
        // the emotion colour over the paper an empty one shows.
        width: 8,
        height: 8,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    avgText: {
        ...TYPE.label,
    },
    daysText: {
        ...TYPE.caption,
    },
    progressBarTrack: {
        // Tall enough to read as a drawn meter rather than a hairline: at the old
        // 4px there was no room for the outline, let alone the cells.
        height: 14,
        backgroundColor: '#F1F5F9',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        // Full width, squashed from the left edge -- scaleX runs on the native
        // driver where an animated `width` would relayout on the JS thread.
        width: '100%',
        transformOrigin: 'left',
    },
    segmentOverlay: {
        ...StyleSheet.absoluteFill,
        flexDirection: 'row',
    },
    segmentGutter: {
        flex: 1,
        borderRightWidth: 2,
        borderRightColor: PAPER,
    },
    segmentCell: {
        // The last cell carries no gutter of its own -- one there would double up
        // with the track's own right border.
        flex: 1,
    },
    emptyContainer: {
        paddingVertical: SPACE.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...TYPE.caption,
    },
});
