import React from 'react';
import { Text, StyleSheet, Pressable, StyleProp, ViewStyle, Insets } from 'react-native';
import { PIXEL, TYPE, TIGHT_FONT_SCALE } from '../../constants/typography';
import { MIN_TOUCH } from '../../constants/layout';
import {
    OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER, PRESSED,
} from '../../constants/pixel';

interface ToggleBoxProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    /** Greyed and inert -- the weekday boxes use it once the week is full. */
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    /**
     * No letter spacing, for a box too narrow for it: seven weekday boxes across a
     * phone leave ~30px each, and "MON" at 12px is ~27px before any tracking.
     */
    tight?: boolean;
    /** For a box drawn shorter than MIN_TOUCH (the Tips filter chips). */
    hitSlop?: Insets;
    /**
     * `checkbox` for a set where several can be on (weekdays, times of day),
     * `radio` for a pick-one row (the Tips filter).
     */
    accessibilityRole?: 'checkbox' | 'radio';
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
    tight = false,
    hitSlop,
    accessibilityRole = 'checkbox',
}: ToggleBoxProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            hitSlop={hitSlop}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={label}
            accessibilityState={
                accessibilityRole === 'radio'
                    ? { selected, disabled }
                    : { checked: selected, disabled }
            }
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
                    tight && styles.labelTight,
                    selected && styles.labelSelected,
                    disabled && !selected && styles.labelDisabled,
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={TIGHT_FONT_SCALE}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: {
        // A floor, not a height: a large system font gets a taller box, not a clipped label.
        minHeight: MIN_TOUCH,
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
        backgroundColor: PRESSED,
    },
    boxDisabled: {
        // Keep the outline at full strength -- fading it would soften the pixel
        // edge, which is the one thing this style cannot afford. The fill carries
        // the state, exactly as it does on a disabled PrimaryButton.
        backgroundColor: '#E8EAEE',
    },
    label: {
        ...TYPE.label,
    },
    labelTight: {
        letterSpacing: 0,
    },
    labelSelected: {
        color: PAPER,
    },
    labelDisabled: {
        fontFamily: PIXEL,
        color: INK_MUTED,
    },
});
