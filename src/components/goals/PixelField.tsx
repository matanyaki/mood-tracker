import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED,
    SHADOW_OFFSET, BORDER_W_INNER,
} from '../../constants/pixel';

interface PixelFieldProps {
    eyebrow: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    maxLength?: number;
    /** Share of the row this field takes, against its siblings. */
    flex?: number;
}

/**
 * A text input wearing the same face as PixelSelect -- outlined trigger, hard
 * offset shadow, bracketed eyebrow above it -- so a typed field and a chosen one
 * read as the same kind of control when they sit side by side in the goal form.
 */
export default function PixelField({
    eyebrow,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    maxLength,
    flex = 1,
}: PixelFieldProps) {
    return (
        <View style={{ flex }}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>

            <View style={styles.wrapper}>
                <View style={styles.shadow} pointerEvents="none" />

                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#A8B0BC"
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    underlineColorAndroid="transparent"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    eyebrow: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 8,
    },
    wrapper: {
        position: 'relative',
        marginRight: SHADOW_OFFSET, // Room for the offset shadow
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    input: {
        height: 40,
        paddingVertical: 0, // Cleared before the box sets its own metrics
        paddingHorizontal: 12,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        fontSize: 12,
        fontFamily: PIXEL,
        color: INK,
        letterSpacing: 1,
        // Android's default font padding pushes the text off the centre line of a
        // fixed-height box, the same way it did in GratitudeNote.
        includeFontPadding: false,
    },
});
