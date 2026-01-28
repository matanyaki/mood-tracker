import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getEmotionColor } from '../utils/emotionUtils';
import { MOOD_IMAGES } from '../constants/images';

interface Emotion {
    name: string;
    note?: string;
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
                const color = getEmotionColor(emotion.name);
                const lowerName = emotion.name.toLowerCase();
                const imageSource = MOOD_IMAGES[lowerName];
                const isLast = index === emotions.length - 1;

                return (
                    <View key={index} style={styles.row}>
                        {/* Left Column: Timeline & Visuals */}
                        <View style={styles.leftColumn}>
                            {/* Vertical Connector Line */}
                            {!isLast && <View style={styles.timelineLine} />}

                            {/* Emoji Container */}
                            <View style={styles.imageContainer}>
                                {imageSource ? (
                                    <Image
                                        source={imageSource}
                                        style={styles.moodImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={[styles.dotFallback, { backgroundColor: color }]} />
                                )}
                            </View>
                        </View>

                        {/* Right Column: Content */}
                        <View style={styles.rightColumn}>
                            <Text style={styles.emotionTitle}>
                                {emotion.name}
                            </Text>

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
        paddingVertical: 8,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2, // Spacing handled by minHeight or padding
    },

    // Left Column
    leftColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 12,
    },
    imageContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff', // Ensure background covers line if needed
        zIndex: 2,
    },
    moodImage: {
        width: 40,
        height: 40,
    },
    dotFallback: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    timelineLine: {
        position: 'absolute',
        top: 40, // Start below the emoji
        bottom: -16, // Extend to next item. Adjust based on row spacing
        width: 2,
        backgroundColor: '#E5E7EB', // Gray-200
        zIndex: 1,
    },

    // Right Column
    rightColumn: {
        flex: 1,
        paddingTop: 8, // Align text roughly with center of emoji or slightly top
        paddingBottom: 24, // Space between items
    },
    emotionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 16,
        color: '#4A4A4A',
        fontStyle: 'italic',
        lineHeight: 24,
    },
});
