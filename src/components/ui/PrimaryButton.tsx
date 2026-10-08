import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { TYPE } from '../../constants/typography';
import { OUTLINE, INK, PAPER, SHADOW_OFFSET, BORDER_W } from '../../constants/pixel';
import { MIN_TOUCH, SPACE } from '../../constants/layout';

/**
 * The face colours a PrimaryButton comes in, each with the text colour that reads
 * on it. Green carries navy text: white on this green was 2.5:1.
 */
const TONES = {
    green: { face: '#10B981', text: INK },   // 6.7:1
    navy: { face: INK, text: '#FFFFFF' },    // 17:1
    paper: { face: PAPER, text: INK },       // 17:1 -- a step back, e.g. Reflection's < Back
} as const;

export type PrimaryButtonTone = keyof typeof TONES;

/** The colour to draw an icon in, so it matches the label beside it. */
export const primaryButtonInk = (tone: PrimaryButtonTone = 'green') => TONES[tone].text;

interface PrimaryButtonProps {
    onPress: () => void;
    label: string;
    disabled?: boolean;
    loading?: boolean;
    tone?: PrimaryButtonTone;
    /** Layout only -- the face colour comes from `tone`. */
    style?: ViewStyle;
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
    tone = 'green',
    style,
    icon
}) => {
    const [pressed, setPressed] = useState(false);
    const isInert = disabled || loading;
    const sunk = pressed && !isInert;
    const colors = TONES[tone];

    return (
        <View style={styles.wrapper}>
            {/* Hard shadow: a sibling block, not a blur. Hidden while sunk, since the
                face is sitting on top of exactly where it would be drawn. */}
            {!isInert && !sunk && <View style={styles.shadow} pointerEvents="none" />}

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: colors.face },
                    style,
                    isInert && styles.disabled,
                    sunk && styles.sunk,
                ]}
                onPress={onPress}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                disabled={isInert}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled: isInert, busy: loading }}
            >
                {loading ? (
                    <ActivityIndicator color={colors.text} />
                ) : (
                    <>
                        {icon && icon}
                        <Text
                            style={[
                                styles.text,
                                { color: isInert ? INK : colors.text },
                                icon ? styles.textWithIcon : undefined,
                            ]}
                        >
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
        minHeight: MIN_TOUCH,
        paddingVertical: SPACE.lg,
        paddingHorizontal: SPACE.xl,
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
        ...TYPE.h3,
        letterSpacing: 1,
        textAlign: 'center',
    },
    textWithIcon: {
        marginLeft: SPACE.sm,
    },
});
