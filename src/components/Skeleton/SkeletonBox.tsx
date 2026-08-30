import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';

export interface SkeletonBoxProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * The single animated grey placeholder used by every screen skeleton.
 *
 * This is the ONLY place the pulse animation is defined — skeletons compose
 * these boxes rather than animating anything themselves.
 */
export default function SkeletonBox({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style,
}: SkeletonBoxProps) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor: '#E0E0E0' },
                animatedStyle,
                style,
            ]}
        />
    );
}

export { SkeletonBox };
