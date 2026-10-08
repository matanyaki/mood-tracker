import React from 'react';
import { View, Text, StyleSheet, TextInput, Image } from 'react-native';
import PixelCard from '../ui/PixelCard';
import { MOOD_IMAGES } from '../../constants/images';
import { getEmotionImageKey, type EmotionId } from '../../../shared/types/emotions';
import { getEmotionColor, getEmotionInk } from '../../constants/colors';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SPACE } from '../../constants/layout';
import { OUTLINE, INK, BORDER_W_INNER } from '../../constants/pixel';

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
 * plus a 24px radius, and both are the opposite of what this style needs. It is a
 * PixelCard with the emotion's colour as the accent bar.
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
        <PixelCard padding={CARD_PADDING} accentColor={color}>
            <View style={styles.cardHeader}>
                <Image
                    source={MOOD_IMAGES[getEmotionImageKey(rootEmotionId)]}
                    style={styles.emotionImage}
                    resizeMode="contain"
                />
                <Text style={[styles.emotionTitle, { color: getEmotionInk(rootEmotionId) }]}>{label.toUpperCase()}</Text>
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
                accessibilityLabel={`Why do you feel ${label.toLowerCase()}?`}
            />
        </PixelCard>
    );
});

ReflectionCard.displayName = 'ReflectionCard';

const styles = StyleSheet.create({
    cardHeader: {
        alignItems: 'center',
        paddingBottom: SPACE.md,
        marginBottom: SPACE.lg,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    emotionImage: {
        width: 60,
        height: 60,
        marginBottom: SPACE.md,
    },
    emotionTitle: {
        // The card's title, so h3 -- h1 belongs to the screen header alone.
        ...TYPE.h3,
        marginBottom: SPACE.xs,
    },
    helperText: {
        ...TYPE.caption,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: SPACE.md,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        ...TYPE.bodyLg,
        color: INK,
        minHeight: 130,
        includeFontPadding: false, // Android: keep the first line off the top border
    },
});

export default ReflectionCard;
