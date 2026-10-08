import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MOOD_IMAGES } from '../../constants/images';
import { getEmotionColor, getEmotionInk } from '../../constants/colors';
import { getEmotionImageKey, type EmotionId } from '../../../shared/types/emotions';
import { TYPE } from '../../constants/typography';
import { SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, BORDER_W_INNER } from '../../constants/pixel';

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
                const ink = getEmotionInk(id);
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
                                <Text style={[styles.emotionTitle, { color: ink }]}>
                                    {label.toUpperCase()}
                                </Text>
                                {scale !== undefined && scale > 0 && (
                                    <View style={[styles.scaleBadge, { backgroundColor: color + '20', borderColor: color }]}>
                                        <Text style={[styles.scaleText, { color: ink }]}>
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
        paddingVertical: SPACE.sm,
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: SPACE.xs,
    },
    timelineColumn: {
        // Same column as DayEntryModal's greeting and goal timelines, so the three
        // sections' icons share one vertical line.
        width: 48,
        alignItems: 'center',
        marginRight: SPACE.md,
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
        marginVertical: SPACE.xs,
    },
    contentColumn: {
        flex: 1,
        paddingTop: SPACE.sm,
        paddingBottom: SPACE.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
        flexWrap: 'wrap',
        marginBottom: SPACE.xs,
    },
    emotionTitle: {
        ...TYPE.h3,
    },
    scaleBadge: {
        paddingHorizontal: SPACE.xs,
        // Square and outlined in the emotion's own colour, so the badge reads as
        // a drawn chip rather than the soft pill it was.
        borderWidth: BORDER_W_INNER,
    },
    scaleText: {
        ...TYPE.label,
    },
    noteText: {
        ...TYPE.bodyLg,
        color: '#475569',
        // No italic: Silkscreen ships one upright face per weight, so RN fakes the
        // slant by shearing the bitmap, which tears the pixel grid.
    },
});
