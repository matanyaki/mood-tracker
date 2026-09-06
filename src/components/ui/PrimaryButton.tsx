import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, SHADOW_OFFSET, BORDER_W } from '../../constants/pixel';

interface PrimaryButtonProps {
    onPress: () => void;
    label: string;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

/**
 * Pixel-art action button: flat outline, hard offset shadow, square corners.
 *
 * Pressing sinks the face by exactly SHADOW_OFFSET so it lands on its own shadow
 * block -- that travel *is* the press feedback, which is why the old
 * `activeOpacity` fade is gone. Opacity would have dimmed the button without
 * moving it, and a pixel button that does not move does not read as clicked.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    onPress,
    label,
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {
    const [pressed, setPressed] = useState(false);
    const isInert = disabled || loading;
    const sunk = pressed && !isInert;

    return (
        <View style={styles.wrapper}>
            {/* Hard shadow: a sibling block, not a blur. Hidden while sunk, since the
                face is sitting on top of exactly where it would be drawn. */}
            {!isInert && !sunk && <View style={styles.shadow} pointerEvents="none" />}

            <Pressable
                style={[
                    styles.button,
                    style,
                    isInert && styles.disabled,
                    sunk && styles.sunk,
                ]}
                onPress={onPress}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                disabled={isInert}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        {icon && icon}
                        <Text style={[styles.text, textStyle, icon ? { marginLeft: 8 } : undefined]}>
                            {label}
                        </Text>
                    </>
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        // `stretch` rather than width:'100%' -- the wrapper has to give up its right
        // edge to the shadow, and a 100% width plus a margin would overflow the parent.
        alignSelf: 'stretch',
        position: 'relative',
        marginRight: SHADOW_OFFSET,
        marginBottom: SHADOW_OFFSET,
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    button: {
        backgroundColor: '#10B981', // Default green (CheckIn); Reflection overrides to navy
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sunk: {
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    disabled: {
        backgroundColor: '#CBD5E1',
        // Keep the outline at full strength -- fading it would blur the pixel edge,
        // which is the one thing this style cannot afford. The fill carries the state.
        borderColor: '#94A3B8',
    },
    text: {
        color: '#FFF',
        fontSize: 15,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
});
