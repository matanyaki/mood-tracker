import React from 'react';
import { Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER,
} from '../../constants/pixel';

interface ToggleBoxProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    /** Greyed and inert -- the weekday boxes use it once the week is full. */
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    /** Long labels ("AFTERNOON") need to come down a point to fit their box. */
    fontSize?: number;
}

/**
 * One square, on or off. The weekday row and the time-of-day grid are both built
 * from these.
 *
 * Selection inverts the box rather than tinting it -- ink and paper swap places,
 * the same way PixelSelect marks its chosen row. A tint would need a second colour
 * that carries no meaning, and would read as "highlighted" rather than "picked".
 */
export default function ToggleBox({
    label,
    selected,
    onPress,
    disabled = false,
    style,
    fontSize = 9,
}: ToggleBoxProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.box,
                selected && styles.boxSelected,
                disabled && !selected && styles.boxDisabled,
                pressed && !selected && !disabled && styles.boxPressed,
                style,
            ]}
        >
            <Text
                style={[
                    styles.label,
                    { fontSize },
                    selected && styles.labelSelected,
                    disabled && !selected && styles.labelDisabled,
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    boxSelected: {
        backgroundColor: INK,
        borderColor: INK,
    },
    boxPressed: {
        backgroundColor: '#DDE3EA',
    },
    boxDisabled: {
        // Keep the outline at full strength -- fading it would soften the pixel
        // edge, which is the one thing this style cannot afford. The fill carries
        // the state, exactly as it does on a disabled PrimaryButton.
        backgroundColor: '#E8EAEE',
    },
    label: {
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    labelSelected: {
        color: PAPER,
    },
    labelDisabled: {
        fontFamily: PIXEL,
        color: INK_MUTED,
    },
});
