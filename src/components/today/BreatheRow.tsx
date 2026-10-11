import React from 'react';
import { Text, Image, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import { MONK_IMAGE } from '../../constants/images';
import { INHALE_SECONDS, HOLD_SECONDS, EXHALE_SECONDS } from '../../constants/breathing';
import { SPACE } from '../../constants/layout';
import { TYPE } from '../../constants/typography';
import { INK_MUTED, PRESS_SINK } from '../../constants/pixel';

/**
 * The monk, in dp. The figure only fills the middle of its canvas, so the image's
 * own transparent margin is what spaces it from the row's edges.
 */
const MONK = 36;

interface BreatheRowProps {
    /** Opens the Breathe screen. */
    onPress: () => void;
}

/**
 * The way into the guided breathing session: one slim row in the pixel card style.
 *
 * It reports nothing -- no streak, no state -- so it takes a single line rather
 * than a card's worth of height. The session itself belongs to BreatheScreen.
 *
 * No accent bar, unlike the cards around it: the label fills a 360dp phone's row
 * as it is, and a bar would push it onto a second line.
 */
export default function BreatheRow({ onPress }: BreatheRowProps) {
    return (
        <PixelCard padding={0}>
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Take a minute to breathe"
                accessibilityHint={`Opens a guided ${INHALE_SECONDS}-${HOLD_SECONDS}-${EXHALE_SECONDS} breathing exercise`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
                <Image source={MONK_IMAGE} style={styles.monk} resizeMode="contain" />
                <Text style={styles.label}>TAKE A MINUTE TO BREATHE</Text>
                <ChevronRight size={16} color={INK_MUTED} strokeWidth={3} />
            </Pressable>
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
        // 36 + 4 + 4 inside a 3px outline: a 50dp row, clear of the 44 touch floor.
        paddingVertical: SPACE.xs,
        paddingLeft: SPACE.xs,
        paddingRight: SPACE.sm,
    },
    rowPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
    },
    monk: {
        width: MONK,
        height: MONK,
    },
    label: {
        ...TYPE.label,
        flex: 1,
        // Half of label's tracking, as on the streak tiles: at 12px the line is
        // ~233dp, and a 360dp phone leaves it ~238 beside the monk and the chevron.
        // A narrower phone or a larger font wraps it onto a second line instead of
        // cutting it off.
        letterSpacing: 0.5,
    },
});
