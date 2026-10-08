import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { TYPE } from '../../constants/typography';
import { MIN_TOUCH, SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, PRESSED, PRESS_SINK, BORDER_W_INNER } from '../../constants/pixel';

interface SecondaryButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    /** Layout only -- width, flex, alignSelf, margins. The face is fixed. */
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

/**
 * The quiet button: paper face, thin outline, no shadow block. Retry, show all,
 * the alert buttons -- anything that should not compete with a screen's one
 * PrimaryButton.
 *
 * It used to be written out by hand in eight places at ~38px tall; this one is
 * never shorter than MIN_TOUCH.
 */
export default function SecondaryButton({
    label,
    onPress,
    disabled = false,
    style,
    accessibilityLabel,
}: SecondaryButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
                styles.button,
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
                style,
            ]}
        >
            <Text style={styles.text}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACE.lg,
        paddingVertical: SPACE.sm,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    pressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
        backgroundColor: PRESSED,
    },
    disabled: {
        opacity: 0.4,
    },
    text: {
        ...TYPE.label,
        textAlign: 'center',
    },
});
