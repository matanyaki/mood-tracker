import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import PixelCard from '../ui/PixelCard';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { MOOD_IMAGES } from '../../constants/images';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

export interface EmotionStat {
    label: string;
    count: number;
    color: string;
    percentage: number;
}

interface EmotionBreakdownProps {
    stats: EmotionStat[];
}

/** Gutters drawn over the bar, which is what gives it its segmented meter look. */
const BAR_SEGMENTS = 10;
const SEGMENT_GUTTERS = Array.from({ length: BAR_SEGMENTS - 1 }, (_, i) => i);

/**
 * Flat, opaque tint of the emotion colour for the count badge, plus a darkened
 * ink for the text on it.
 *
 * The tint is mixed toward paper rather than laid down as `rgba(..., 0.15)`:
 * a translucent fill borrows whatever is behind it, and a pixel surface wants a
 * colour that is the same block wherever it lands.
 */
const getBadgeColors = (hexColor: string) => {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    const mix = (channel: number) => Math.round(channel * 0.18 + 255 * 0.82);
    const bg = `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;

    // Heavily darkened text colour (multiply RGB channels by 0.45 for contrast)
    const text = `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`;

    return { bg, text };
};

/**
 * Individual emotion row displaying text, count, percentage, and an animated meter.
 */
const EmotionRowItem = ({ item }: { item: EmotionStat; key?: React.Key }) => {
    const reduceMotion = useReducedMotion();

    // The fill is laid out at full width and squashed horizontally, so the animated
    // value IS the fraction of the track to cover -- animating it re-targets from
    // wherever the bar currently sits, which is what makes a filter change slide
    // rather than jump.
    const fraction = Math.max(0, Math.min(item.percentage, 100)) / 100;
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

    // EmotionStat carries a label rather than an id, so the registry entry is
    // located by label; its imageKey is still the registry's.
    const imageKey = EMOTIONS_CONFIG.find(
        (e) => e.label === item.label
    )!.imageKey;

    const { bg: badgeBg, text: badgeText } = getBadgeColors(item.color);

    return (
        <View style={styles.rowContainer}>
            {/* Top Row: Info and Count/Percentage */}
            <View style={styles.topRow}>
                {/* Left Side: Image Asset and Label */}
                <View style={styles.leftGroup}>
                    <Image
                        source={MOOD_IMAGES[imageKey]}
                        style={styles.emotionImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.labelText}>{item.label.toUpperCase()}</Text>
                </View>

                {/* Right Side: Percentage and Occurrence Badge */}
                <View style={styles.rightGroup}>
                    <Text style={styles.percentageText}>
                        {Math.round(item.percentage)}%
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.badgeText, { color: badgeText }]}>
                            {item.count}x
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom Row: Segmented meter */}
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
        </View>
    );
};

export default function EmotionBreakdown({ stats = [] }: EmotionBreakdownProps) {
    // No light/dark theming here any more: the pixel palette is a fixed set of
    // inks that every other surface in the app draws with, and a card that
    // swapped itself to navy would be the only one doing it.

    // Data filtering: skip rows where count <= 0
    const activeStats = (stats || []).filter(item => item && item.count > 0);
    const hasActiveEmotions = activeStats.length > 0;

    return (
        <PixelCard padding={18} wrapperStyle={styles.cardWrapper}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>EMOTION BREAKDOWN</Text>
                <Text style={styles.cardSubtitle}>
                    Frequency and relative weight this month
                </Text>
            </View>

            {/* Active Emotion Rows flat list (No valence sections) */}
            {hasActiveEmotions ? (
                <View style={styles.rowsContainer}>
                    {activeStats.map((row) => (
                        <EmotionRowItem key={row.label} item={row} />
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
        width: 24,
        height: 24,
    },
    labelText: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    percentageText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        minWidth: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        lineHeight: 12,
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
