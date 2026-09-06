import React from 'react';
import { View, Text, StyleSheet, TextInput, Image } from 'react-native';
import { MOOD_IMAGES } from '../../constants/images';
import { getEmotionImageKey, type EmotionId } from '../../../shared/types/emotions';
import { getEmotionColor } from '../../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK,
    SHADOW_OFFSET, BORDER_W, BORDER_W_INNER, ACCENT_BAR_W,
} from '../../constants/pixel';

interface ReflectionCardProps {
    label: string;
    rootEmotionId: EmotionId;
    note: string;
    onChangeText: (id: string, text: string) => void;
    isLast: boolean; // Optional: Determine if we show save button here or externally
    onSave?: () => void;
    loading?: boolean;
}

/**
 * One emotion's note, drawn as a pixel-art card.
 *
 * It no longer wraps <Card>: that component's whole job is a blurred drop shadow
 * plus a 24px radius, and both are the opposite of what this style needs. The
 * hard shadow block and square outline are drawn here instead.
 */
const ReflectionCard: React.FC<ReflectionCardProps> = React.memo(({
    label,
    rootEmotionId,
    note,
    onChangeText,
    isLast,
    onSave,
    loading = false,
}) => {
    const color = getEmotionColor(rootEmotionId);

    return (
        <View style={styles.wrapper}>
            <View style={styles.shadow} pointerEvents="none" />

            <View style={[styles.card, { borderLeftColor: color }]}>
                <View style={styles.cardHeader}>
                    <Image
                        source={MOOD_IMAGES[getEmotionImageKey(rootEmotionId)]}
                        style={styles.emotionImage}
                        resizeMode="contain"
                    />
                    <Text style={[styles.emotionTitle, { color }]}>{label.toUpperCase()}</Text>
                    <Text style={styles.helperText}>[ WHY DO YOU FEEL THIS WAY? ]</Text>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder={`I feel ${label.toLowerCase()} because...`}
                    placeholderTextColor="#A8B0BD"
                    multiline
                    textAlignVertical="top"
                    value={note}
                    onChangeText={(text) => onChangeText(rootEmotionId, text)}
                    underlineColorAndroid="transparent"
                />
            </View>
        </View>
    );
});

ReflectionCard.displayName = 'ReflectionCard';

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginBottom: 20,
        marginRight: SHADOW_OFFSET, // Room for the offset shadow
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    card: {
        backgroundColor: PAPER,
        padding: 20,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
        borderLeftWidth: ACCENT_BAR_W, // Colour bar keyed to the emotion
    },
    cardHeader: {
        alignItems: 'center',
        paddingBottom: 14,
        marginBottom: 16,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    emotionImage: {
        width: 60,
        height: 60,
        marginBottom: 12,
    },
    emotionTitle: {
        // Silkscreen is wide (~0.76em per char bold), so 24px overflowed on the
        // longer labels once they were uppercased. 18px holds every one of them.
        fontSize: 18,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 2,
        marginBottom: 8,
    },
    helperText: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: '#7C8698',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        fontSize: 14,
        lineHeight: 22,
        fontFamily: PIXEL,
        color: INK,
        minHeight: 130,
        includeFontPadding: false, // Android: keep the first line off the top border
    },
});

export default ReflectionCard;
