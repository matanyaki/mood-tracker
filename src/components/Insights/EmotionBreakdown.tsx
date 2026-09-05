import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useColorScheme, Image } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Card from '../../components/Card';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { MOOD_IMAGES } from '../../constants/images';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';

export interface EmotionStat {
    label: string;
    count: number;
    color: string;
    percentage: number;
}

interface EmotionBreakdownProps {
    stats: EmotionStat[];
}

/**
 * Helper to compute an opacity-reduced background color and a heavily darkened text
 * color from the base emotion color hex for contrast and readability.
 */
const getContrastColorStyle = (hexColor: string) => {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    // 15% opacity background
    const bg = `rgba(${r}, ${g}, ${b}, 0.15)`;

    // Heavily darkened text color (multiply RGB channels by 0.45 for contrast)
    const darkR = Math.round(r * 0.45);
    const darkG = Math.round(g * 0.45);
    const darkB = Math.round(b * 0.45);
    const text = `rgb(${darkR}, ${darkG}, ${darkB})`;

    return { bg, text };
};

/**
 * Individual emotion row displaying text, count, percentage, and an animated progress bar.
 */
const EmotionRowItem = ({ item, theme }: { item: EmotionStat; theme: any; key?: React.Key }) => {
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

    const { bg: badgeBg, text: badgeText } = getContrastColorStyle(item.color);

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
                    <Text style={[styles.labelText, { color: theme.primaryText }]}>
                        {item.label}
                    </Text>
                </View>

                {/* Right Side: Percentage and Occurrence Badge */}
                <View style={styles.rightGroup}>
                    <Text style={[styles.percentageText, { color: theme.secondaryText }]}>
                        {Math.round(item.percentage)}%
                    </Text>
                    <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.badgeText, { color: badgeText }]}>
                            {item.count}×
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom Row: Horizontal Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: theme.trackBg }]}>
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
            </View>
        </View>
    );
};

export default function EmotionBreakdown({ stats = [] }: EmotionBreakdownProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Theme values for seamless light/dark mode support
    const theme = {
        cardBg: isDark ? '#1E293B' : '#FFFFFF',
        cardBorder: isDark ? '#334155' : '#E2E8F0',
        primaryText: isDark ? '#F1F5F9' : '#0F172A',
        secondaryText: isDark ? '#94A3B8' : '#64748B',
        tertiaryText: isDark ? '#64748B' : '#94A3B8',
        trackBg: isDark ? '#334155' : '#E2E8F0',
    };

    // 1. Data Filtering: Skip rows where count <= 0
    const activeStats = (stats || []).filter(item => item && item.count > 0);
    const hasActiveEmotions = activeStats.length > 0;

    return (
        <Card
            padding={20}
            borderRadius={24}
            elevation={0}
            style={[
                styles.cardContainer,
                {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                }
            ]}
            children={(
                <>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: theme.primaryText }]}>
                            Emotion breakdown
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: theme.secondaryText }]}>
                            Frequency and relative weight this month
                        </Text>
                    </View>

                    {/* Active Emotion Rows flat list (No valence sections) */}
                    {hasActiveEmotions ? (
                        <View style={styles.rowsContainer}>
                            {activeStats.map((row) => (
                                <EmotionRowItem
                                    key={row.label}
                                    item={row}
                                    theme={theme}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                                No entries matching filter
                            </Text>
                        </View>
                    )}
                </>
            )}
        />
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        borderWidth: 1,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        marginBottom: 24,
    },
    cardHeader: {
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: PIXEL_BOLD,
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        fontFamily: PIXEL,
        marginTop: 2,
    },
    rowsContainer: {
        gap: 12, // 12px vertical gap between rows
    },
    rowContainer: {
        flexDirection: 'column',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    emotionImage: {
        width: 25,
        height: 25,
    },
    labelText: {
        fontSize: 15,
        fontFamily: PIXEL_BOLD,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    percentageText: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
    },
    badgePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        lineHeight: 12,
    },
    progressBarTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        // Full width, squashed from the left edge -- scaleX runs on the native
        // driver where an animated `width` would relayout on the JS thread.
        width: '100%',
        transformOrigin: 'left',
        borderRadius: 2,
    },
    emptyContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: PIXEL,
    },
});
