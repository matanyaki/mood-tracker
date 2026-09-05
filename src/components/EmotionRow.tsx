import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { getEmotionColor } from '../constants/colors';
import { MOOD_IMAGES } from '../constants/images';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED,
    SHADOW_OFFSET, BORDER_W, BORDER_W_INNER, ACCENT_BAR_W,
} from '../constants/pixel';

export interface EmotionRowProps {
    id: string;
    label: string;
    imageKey: string;
    currentScale: number;
    onScaleChange: (id: string, label: string, val: number) => void;
}

const SCALE_POINTS = [1, 2, 3, 4, 5];

/**
 * One emotion and its 1-5 intensity scale, drawn as a pixel-art card.
 *
 * The left accent bar is always ACCENT_BAR_W wide and only changes colour with
 * selection -- growing it on select would shove the whole row's contents sideways
 * every time someone taps a number.
 */
export const EmotionRow: React.FC<EmotionRowProps> = React.memo(({
    id, label, imageKey, currentScale, onScaleChange
}) => {
    const color = getEmotionColor(id);
    const isSelected = currentScale > 0;

    return (
        <View style={styles.wrapper}>
            {/* Hard offset shadow. Only selected rows cast one, so the chosen
                emotions visibly lift off the page as the list is filled in. */}
            {isSelected && <View style={styles.shadow} pointerEvents="none" />}

            <View style={[
                styles.emotionRow,
                { borderLeftColor: isSelected ? color : '#CBD5E1' },
                isSelected && styles.emotionRowSelected,
            ]}>
                {/* Left: Image & Label */}
                <View style={styles.emotionInfo}>
                    <Image
                        source={MOOD_IMAGES[imageKey]}
                        style={styles.emotionImage}
                        resizeMode="contain"
                    />
                    <Text style={[styles.emotionLabel, isSelected && { color }]}>
                        {label}
                    </Text>

                    {/* Reads as a pixel readout rather than a badge: brackets are in
                        Silkscreen, and the geometric glyphs it lacks are not. */}
                    {isSelected && (
                        <Text style={[styles.scaleReadout, { color }]}>
                            [{currentScale}/5]
                        </Text>
                    )}
                </View>

                {/* Right: Horizontal Scale */}
                <View style={styles.scaleContainer}>
                    {SCALE_POINTS.map((point) => {
                        const isActive = currentScale === point;
                        return (
                            <Pressable
                                key={point}
                                style={({ pressed }) => [
                                    styles.scaleButton,
                                    isActive && { backgroundColor: color },
                                    pressed && !isActive && styles.scaleButtonPressed,
                                ]}
                                onPress={() => onScaleChange(id, label, isActive ? 0 : point)} // Toggle off if active
                            >
                                <Text style={[
                                    styles.scaleText,
                                    isActive && styles.scaleTextActive,
                                ]}>
                                    {point}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
});

EmotionRow.displayName = 'EmotionRow';

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginRight: SHADOW_OFFSET, // Room for the shadow a selected row casts
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    emotionRow: {
        flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.72)',
        padding: 16,
        gap: 16,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
        borderLeftWidth: ACCENT_BAR_W,
    },
    emotionRowSelected: {
        backgroundColor: PAPER, // Fully opaque once chosen, so it separates from the bg
    },
    emotionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emotionImage: {
        width: 40,
        height: 40,
    },
    emotionLabel: {
        fontSize: 16,
        fontFamily: PIXEL_BOLD,
        color: '#334155',
        letterSpacing: 1,
    },
    scaleReadout: {
        marginLeft: 'auto',
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    scaleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    scaleButton: {
        flex: 1,
        height: 42,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    scaleButtonPressed: {
        backgroundColor: '#DDE3EA',
    },
    scaleText: {
        fontSize: 15,
        fontFamily: PIXEL,
        color: INK_MUTED,
    },
    scaleTextActive: {
        fontFamily: PIXEL_BOLD,
        // White on amber (#F59E0B) is the weakest pair in the taxonomy; the outline
        // and a dark shadowless fill do the separating, so keep the text ink-dark.
        color: INK,
    },
});
