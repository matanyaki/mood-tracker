import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { getEmotionColor } from '../constants/colors';
import { MOOD_IMAGES } from '../constants/images';
import { PIXEL_BOLD } from '../constants/typography';

export interface EmotionRowProps {
    id: string;
    label: string;
    imageKey: string;
    currentScale: number;
    onScaleChange: (id: string, label: string, val: number) => void;
}

const SCALE_POINTS = [1, 2, 3, 4, 5];

export const EmotionRow: React.FC<EmotionRowProps> = React.memo(({
    id, label, imageKey, currentScale, onScaleChange
}) => {
    const color = getEmotionColor(id);
    const isSelected = currentScale > 0;

    return (
        <View style={[
            styles.emotionRow,
            isSelected && { backgroundColor: '#FFFFFF', borderColor: color, borderWidth: 1 }
        ]}>
            {/* Left: Image & Label */}
            <View style={styles.emotionInfo}>
                <Image
                    source={MOOD_IMAGES[imageKey]}
                    style={styles.emotionImage}
                    resizeMode="contain"
                />
                <Text style={[
                    styles.emotionLabel,
                    isSelected && { fontFamily: PIXEL_BOLD, color: color }
                ]}>
                    {label}
                </Text>
            </View>

            {/* Right: Horizontal Scale */}
            <View style={styles.scaleContainer}>
                {SCALE_POINTS.map((point) => {
                    const isActive = currentScale === point;
                    return (
                        <TouchableOpacity
                            key={point}
                            style={[
                                styles.scaleButton,
                                isActive && { backgroundColor: color, borderColor: color }
                            ]}
                            onPress={() => onScaleChange(id, label, isActive ? 0 : point)} // Toggle off if active
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.scaleText,
                                isActive && { fontFamily: PIXEL_BOLD, color: '#FFFFFF' }
                            ]}>
                                {point}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

EmotionRow.displayName = 'EmotionRow';

const styles = StyleSheet.create({
    emotionRow: {
        flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: 'transparent',
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
        fontSize: 18,
        fontFamily: PIXEL_BOLD,
        color: '#334155',
    },
    scaleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    scaleButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    scaleText: {
        fontSize: 16,
        fontFamily: PIXEL_BOLD,
        color: '#64748B',
    },
});
