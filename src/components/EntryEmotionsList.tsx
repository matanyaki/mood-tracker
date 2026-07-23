import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MOOD_IMAGES } from '../constants/images';
import { getEmotionColor } from '../constants/colors';

interface Emotion {
    id: string;      // New standard
    label?: string;  // New standard
    scale?: number;  // New standard
    name?: string;   // Legacy fallback
    note?: string;   // Legacy/New
    [key: string]: any;
}

interface EntryEmotionsListProps {
    emotions: Emotion[];
}

export default function EntryEmotionsList({ emotions }: EntryEmotionsListProps) {
    if (!emotions || emotions.length === 0) return null;

    return (
        <View style={styles.container}>
            {emotions.map((emotion, index) => {
                // Handle new vs legacy data
                const id = emotion.id || emotion.name?.toLowerCase() || 'happy';
                const label = emotion.label || emotion.name || 'Emotion';
                const scale = emotion.scale;

                const color = getEmotionColor(id);
                // "worry" maps to "bad" image based on previous checks
                const imageKey = id === 'worry' ? 'bad' : id;
                const imageSource = MOOD_IMAGES[imageKey] || MOOD_IMAGES['happy'];

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
                                    {label}
                                </Text>
                                {scale !== undefined && scale > 0 && (
                                    <View style={[styles.scaleBadge, { backgroundColor: color + '20' }]}>
                                        <Text style={[styles.scaleText, { color }]}>
                                            Intensity: {scale}/5
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
        backgroundColor: '#fff',
        zIndex: 2,
    },
    moodImage: {
        width: 40,
        height: 40,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#E2E8F0',
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
        fontSize: 18,
        fontWeight: '700',
    },
    scaleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scaleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noteText: {
        fontSize: 15,
        color: '#475569',
        fontStyle: 'italic',
        lineHeight: 22,
    },
});
