import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { OUTLINE, PAPER, INK, PRESSED, PRESS_SINK, BORDER_W_INNER } from '../../constants/pixel';

const SIZE = 36;

interface BackButtonProps {
    onPress: () => void;
}

/**
 * The square back arrow every pushed screen puts in its header's left slot.
 *
 * It was written out by hand on seven screens, none of which told a screen reader
 * what it was. The face stays 36px so it sits level with the title; hitSlop takes
 * the touch area past 44.
 */
export default function BackButton({ onPress }: BackButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
            <ArrowLeft color={INK} size={20} strokeWidth={2.5} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    pressed: {
        // Sinks toward its own corner, matching how PrimaryButton answers a press.
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
        backgroundColor: PRESSED,
    },
});
