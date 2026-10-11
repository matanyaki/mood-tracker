import React, { useCallback, useEffect, useRef } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
    useSharedValue, useAnimatedStyle, useReducedMotion,
    withRepeat, withSequence, withTiming, withSpring, cancelAnimation,
    interpolate, Extrapolation, Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { MONK_IMAGE } from '../../constants/images';
import { INHALE_SECONDS, HOLD_SECONDS, EXHALE_SECONDS } from '../../constants/breathing';
import { INK } from '../../constants/pixel';

/**
 * The monk, in dp. The source is a 1254px canvas, so no whole-number fit exists at
 * this size; 96 is the top of the range because the figure only fills the middle of
 * its canvas (about 44 x 55dp of these 96).
 */
const MONK = 96;

/**
 * Where the figure's base sits inside that box: row 1031 of the 1254px canvas.
 * Tied to this PNG -- the shadow is drawn there, under the feet, not at the box's
 * bottom edge, which is transparent margin.
 */
const FEET = Math.round((MONK * 1031) / 1254);

/** The tap target: a square a little larger than the drawing, centred on it. */
const TOUCH = 100;

/** Idle bob: how high, and how long one way (a full up-and-down is twice this). */
const BOB = 6;
const BOB_HALF_MS = 1500;

/** The hop on a tap: up quickly, then a short spring back down. ~300ms in all. */
const HOP = 16;
const HOP_UP_MS = 120;
const HOP_LAND = { duration: 180, dampingRatio: 0.55 };

/**
 * The shadow, as a stepped pixel ellipse: one run per 2dp row, widest in the
 * middle. Plain views, so its edges stay hard as it scales.
 */
const SHADOW_CELL = 2;
const SHADOW_ROWS = [24, 36, 36, 24];
const SHADOW_OPACITY = 0.18;

const bobEasing = Easing.inOut(Easing.sin);

interface FloatingMonkProps {
    /** Opens the Breathe screen. Called once the hop has landed. */
    onPress: () => void;
}

/**
 * The way into the guided breathing session: the monk on its own, floating.
 *
 * No card, no text -- the figure is the button, and a screen reader gets its name
 * from the label. It bobs while Today is on screen; a tap stops the bob, hops it
 * once (the hop is the press feedback, so there is no pressed box) and then opens
 * Breathe. Everything moves on the UI thread from one shared value: the lift.
 *
 * Reduced motion (the system setting, as FabMenu reads it): it stands still, and a
 * tap goes straight to Breathe.
 */
export default function FloatingMonk({ onPress }: FloatingMonkProps) {
    const isFocused = useIsFocused();
    const reduceMotion = useReducedMotion();

    /** How far up the monk is, in dp: 0 on the ground, negative in the air. */
    const lift = useSharedValue(0);
    /** Set by a tap until Today is back in front, so a second tap cannot hop again. */
    const hopping = useRef(false);

    // The bob runs only while Today is the screen in front. Leaving stops it on the
    // ground; coming back (from Breathe, say) starts it again.
    useEffect(() => {
        if (isFocused) hopping.current = false;

        if (!isFocused || reduceMotion) {
            cancelAnimation(lift);
            lift.value = 0;
            return;
        }

        lift.value = withRepeat(
            withSequence(
                withTiming(-BOB, { duration: BOB_HALF_MS, easing: bobEasing }),
                withTiming(0, { duration: BOB_HALF_MS, easing: bobEasing }),
            ),
            -1,
        );
        return () => cancelAnimation(lift);
    }, [isFocused, reduceMotion, lift]);

    const handlePress = useCallback(() => {
        if (hopping.current) return;
        hopping.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (reduceMotion) {
            onPress();
            return;
        }

        // Assigning the hop replaces the bob mid-swing, from wherever the monk is.
        lift.value = withSequence(
            withTiming(-HOP, { duration: HOP_UP_MS, easing: Easing.out(Easing.quad) }),
            withSpring(0, HOP_LAND, finished => {
                if (finished) scheduleOnRN(onPress);
            }),
        );
    }, [reduceMotion, lift, onPress]);

    const monkStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: lift.value }],
    }));

    // Smaller and fainter the higher the monk goes; full again on landing. Clamped, so the
    // spring's dip below the ground does not grow it past its resting size.
    const shadowStyle = useAnimatedStyle(() => {
        const height = interpolate(lift.value, [-HOP, 0], [1, 0], Extrapolation.CLAMP);
        return {
            opacity: SHADOW_OPACITY * (1 - 0.5 * height),
            transform: [{ scale: 1 - 0.35 * height }],
        };
    });

    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Take a minute to breathe"
            accessibilityHint={`Opens a guided ${INHALE_SECONDS}-${HOLD_SECONDS}-${EXHALE_SECONDS} breathing exercise`}
            style={styles.touch}
        >
            <View style={styles.box}>
                <Animated.View style={[styles.shadow, shadowStyle]} pointerEvents="none">
                    {SHADOW_ROWS.map((width, i) => (
                        <View key={i} style={[styles.shadowRow, { width }]} />
                    ))}
                </Animated.View>

                <Animated.View style={monkStyle}>
                    <Image source={MONK_IMAGE} style={styles.monk} resizeMode="contain" />
                </Animated.View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    touch: {
        alignSelf: 'center',
        width: TOUCH,
        height: TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        width: MONK,
        height: MONK,
    },
    shadow: {
        position: 'absolute',
        left: 0,
        right: 0,
        // Centred on the feet, so the figure's base sits in the ellipse's middle.
        top: FEET - (SHADOW_ROWS.length * SHADOW_CELL) / 2,
        alignItems: 'center',
    },
    shadowRow: {
        height: SHADOW_CELL,
        backgroundColor: INK,
    },
    monk: {
        width: MONK,
        height: MONK,
    },
});
