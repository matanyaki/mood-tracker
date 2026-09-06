import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
    OUTLINE, PAPER,
    SHADOW_OFFSET, BORDER_W, ACCENT_BAR_W,
} from '../../constants/pixel';

interface PixelCardProps {
    children: React.ReactNode;
    /** Applied to the card face -- padding, background, borders. */
    style?: StyleProp<ViewStyle>;
    /** Applied to the outer wrapper, which is what the parent lays out (flex, margins). */
    wrapperStyle?: StyleProp<ViewStyle>;
    padding?: number;
    /** Colour bar down the left edge. Omitted, the card keeps an even outline. */
    accentColor?: string;
    /**
     * Hard offset shadow. Turn it off for a card that already sits inside an
     * outlined surface -- a second block just crowds the first one's edge.
     */
    shadow?: boolean;
}

/**
 * The pixel-art counterpart to <Card>.
 *
 * <Card>'s whole job is a blurred drop shadow plus a 20px radius, and both are
 * the opposite of what this style needs, so this draws the surface the way
 * ReflectionCard and DiaryScreen already do by hand: square corners, a flat
 * outline, and a solid shadow block offset by whole pixels.
 *
 * The wrapper gives up SHADOW_OFFSET on its right and bottom edges so the block
 * lands inside the parent's bounds rather than overflowing it.
 */
export default function PixelCard({
    children,
    style,
    wrapperStyle,
    padding = 16,
    accentColor,
    shadow = true,
}: PixelCardProps) {
    return (
        <View style={[styles.wrapper, shadow && styles.wrapperWithShadow, wrapperStyle]}>
            {shadow && <View style={styles.shadow} pointerEvents="none" />}

            <View
                style={[
                    styles.face,
                    { padding },
                    accentColor
                        ? { borderLeftWidth: ACCENT_BAR_W, borderLeftColor: accentColor }
                        : null,
                    style,
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
    },
    wrapperWithShadow: {
        marginRight: SHADOW_OFFSET,
        marginBottom: SHADOW_OFFSET,
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    face: {
        backgroundColor: PAPER,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
    },
});
