import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AVATAR_IMAGES } from '../../constants/avatars';
import { PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, BORDER_W_INNER } from '../../constants/pixel';

const INDIGO = '#4F46E5';

interface PixelAvatarProps {
    /** Preset avatar id. Unset, or an id this build doesn't ship, falls back to the initial. */
    avatarId?: string | null;
    /** Shown when there is no avatar image. */
    initial: string;
    size: number;
    style?: StyleProp<ViewStyle>;
}

/** The user's square, outlined avatar: their preset art, or their initial. */
export default function PixelAvatar({ avatarId, initial, size, style }: PixelAvatarProps) {
    const source = avatarId ? AVATAR_IMAGES[avatarId] : undefined;

    return (
        <View style={[styles.box, { width: size, height: size }, style]}>
            {source ? (
                <Image source={source} style={styles.image} resizeMode="contain" />
            ) : (
                <Text style={[styles.initial, { fontSize: Math.round(size * 0.44) }]}>{initial}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7FF',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        overflow: 'hidden',
    },
    image: {
        width: '86%',
        height: '86%',
    },
    initial: {
        fontFamily: PIXEL_BOLD,
        color: INDIGO,
    },
});
