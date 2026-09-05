import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MOOD_IMAGES } from '../constants/images';
import { getEmotionColor } from '../constants/colors';
import { getEmotionImageKey, type EmotionId } from '../../shared/types/emotions';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, BORDER_W_INNER } from '../constants/pixel';

interface Emotion {
    id: EmotionId;
    label: string;
    scale: number;
    note?: string;
}

interface EntryEmotionsListProps {
    emotions: Emotion[];
}

export default function EntryEmotionsList({ emotions }: EntryEmotionsListProps) {
    if (!emotions || emotions.length === 0) return null;

    return (
        <View style={styles.container}>
            {emotions.map((emotion, index) => {
                const { id, label, scale } = emotion;

                const color = getEmotionColor(id);
                const imageSource = MOOD_IMAGES[getEmotionImageKey(id)];

                const isLast = index === emotions.length - 1;

                return (
                    <View key={index} style={styles.itemContainer}>
                        {/* Timeline visual */}
                        <View style={styles.timelineColumn}>
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={imageSource}
                                    style={styles.moodImage}
                                    resizeMode="contain"
                                />
                            </View>
                            {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        {/* Content */}
                        <View style={styles.contentColumn}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.emotionTitle, { color }]}>
                                    {label.toUpperCase()}
                                </Text>
                                {scale !== undefined && scale > 0 && (
                                    <View style={[styles.scaleBadge, { backgroundColor: color + '20', borderColor: color }]}>
                                        <Text style={[styles.scaleText, { color }]}>
                                            [{scale}/5]
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Display note if passed (handled in DiaryController usually, but if attached to emotion) */}
                            {emotion.note ? (
                                <Text style={styles.noteText}>
                                    {emotion.note}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timelineColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 12,
    },
    imageWrapper: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        zIndex: 2,
    },
    moodImage: {
        width: 40,
        height: 40,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: OUTLINE,
        marginVertical: 4,
    },
    contentColumn: {
        flex: 1,
        paddingTop: 8,
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    emotionTitle: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 2,
    },
    scaleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        // Square and outlined in the emotion's own colour, so the badge reads as
        // a drawn chip rather than the soft pill it was.
        borderWidth: BORDER_W_INNER,
    },
    scaleText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    noteText: {
        fontSize: 13,
        fontFamily: PIXEL,
        color: '#475569',
        // No italic: Silkscreen ships one upright face per weight, so RN fakes the
        // slant by shearing the bitmap, which tears the pixel grid.
        lineHeight: 22,
    },
});
