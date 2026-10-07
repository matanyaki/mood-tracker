import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import PixelCard from '../ui/PixelCard';
import { getEmotionImageKey } from '../../../shared/types/emotions';
import { MOOD_IMAGES } from '../../constants/images';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

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

/** The intensity scale's top, one pip per step. */
const MAX_INTENSITY = 5;
const PIPS = Array.from({ length: MAX_INTENSITY }, (_, i) => i);

/**
 * The emotion colour darkened enough to set text in.
 *
 * Several fills are pale (Happy's amber sits at 1.5:1 on paper), so the name is
 * drawn in this instead. Channels x 0.45 clears WCAG AA (4.5:1) on PAPER for all
 * nine emotions -- the weakest, Happy, lands at 6.4:1.
 */
const darkInk = (hexColor: string) => {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.substring(i, i + 2), 16) || 0);
    return `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`;
};

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

                {/* Stacked rather than side by side: Silkscreen is wide, and a long
                    name plus both readouts on one line crowds a phone-width card. */}
                <View style={styles.rightGroup}>
                    <Text style={styles.avgText}>avg {avg}</Text>
                    <Text style={styles.daysText}>{daysText}</Text>
                </View>
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
        </View>
    );
};

export default function EmotionBreakdown({ stats = [], loggedDays }: EmotionBreakdownProps) {
    // No light/dark theming here any more: the pixel palette is a fixed set of
    // inks that every other surface in the app draws with, and a card that
    // swapped itself to navy would be the only one doing it.

    // Data filtering: skip emotions not felt on any day
    const activeStats = (stats || []).filter(item => item && item.daysFelt > 0);
    const hasActiveEmotions = activeStats.length > 0;

    return (
        <PixelCard padding={18} wrapperStyle={styles.cardWrapper}>
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
                    {activeStats.map((row) => (
                        <EmotionRowItem key={row.id} item={row} loggedDays={loggedDays} />
                    ))}
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
    cardWrapper: {
        marginBottom: 24,
    },
    cardHeader: {
        paddingBottom: 12,
        marginBottom: 16,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    cardTitle: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    cardSubtitle: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        marginTop: 6,
    },
    rowsContainer: {
        gap: 16,
    },
    rowContainer: {
        flexDirection: 'column',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    emotionImage: {
        width: 28,
        height: 28,
    },
    labelText: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    rightGroup: {
        alignItems: 'flex-end',
    },
    pipRow: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 6,
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
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
    },
    daysText: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        marginTop: 3,
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
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
});
