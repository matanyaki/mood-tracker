import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useReducedMotion,
    withTiming,
    withDelay,
    interpolate,
    runOnJS,
    Easing,
    ReduceMotion,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Plus } from 'lucide-react-native';
import { PIXEL_BOLD } from '../../constants/typography';

export interface FabAction {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    color?: string; // Optional background color for the mini FAB
}

interface FabMenuProps {
    actions: FabAction[];
}

// Pixel-art palette: flat black outline + hard offset shadow (no blur, no radius)
const BORDER = '#000000';
const SHADOW_OFFSET = 4;

const FAB_SIZE = 60;
const MINI_FAB_SIZE = 56;
const ROW_SPACING = 60; // Vertical distance between fanned-out rows

// Opening is a deliberate gesture; closing is the system answering, so it is quicker
// and skips the stagger entirely -- a staggered close would drag the dismissal out
// past the open it is meant to undo.
const OPEN_DURATION = 200;
const CLOSE_DURATION = 130;
const ROW_STAGGER = 50; // Per-row delay on the way out: a fan is a group entrance
const FAN_EASING = Easing.bezier(0.23, 1, 0.32, 1);

// The opacity the rows used to get from TouchableOpacity's activeOpacity.
const PRESSED_OPACITY = 0.8;

interface FabActionRowProps {
    action: FabAction;
    index: number;
    isOpen: boolean;
    reduceMotion: boolean;
    onSelect: () => void;
}

/**
 * One fanned-out row. Each row owns its progress value so the stagger can be a real
 * per-row delay -- folding the offset into one shared value instead would bend the
 * easing curve differently for every row.
 */
const FabActionRow: React.FC<FabActionRowProps> = ({
    action,
    index,
    isOpen,
    reduceMotion,
    onSelect,
}) => {
    const progress = useSharedValue(0);
    const pressed = useSharedValue(0);

    useEffect(() => {
        // ReduceMotion.Never, deliberately: reduced motion is handled in the style below
        // by zeroing the travel, and the value still has to move to carry the fade.
        // Letting the timing snap here would take the fade out with it.
        progress.value = isOpen
            ? withDelay(
                index * ROW_STAGGER,
                withTiming(1, {
                    duration: OPEN_DURATION,
                    easing: FAN_EASING,
                    reduceMotion: ReduceMotion.Never,
                })
            )
            : withTiming(0, {
                duration: CLOSE_DURATION,
                easing: FAN_EASING,
                reduceMotion: ReduceMotion.Never,
            });
    }, [isOpen, index, progress]);

    const animatedStyle = useAnimatedStyle(() => {
        // Every row is absolutely positioned on the FAB, so this offset is also what
        // fans them apart -- a resting position, not just an animation target.
        const restingY = -ROW_SPACING * (index + 1);

        // Reduced motion: the row sits at its fanned-out spot the whole time and only
        // fades, so the travel distance is 0 and nothing flies up the screen.
        const translateY = reduceMotion
            ? restingY
            : interpolate(progress.value, [0, 1], [0, restingY]);

        // The fade finishes at 40% of the travel, so the row is fully visible while it
        // still has ground to cover -- it arrives, rather than popping in displaced.
        const fanOpacity = interpolate(progress.value, [0, 0.4, 1], [0, 1, 1]);

        return {
            opacity: fanOpacity * (1 - pressed.value * (1 - PRESSED_OPACITY)),
            transform: [{ translateY }],
        };
    });

    const tap = Gesture.Tap()
        .hitSlop({ top: 8, bottom: 8, left: 8, right: 8 })
        // Press feedback stays on the UI thread; only the action itself hops to JS.
        .onBegin(() => {
            pressed.value = withTiming(1, { duration: 60 });
        })
        .onFinalize(() => {
            pressed.value = withTiming(0, { duration: 90 });
        })
        // Fires on release, and only once the tap is actually recognised, so a finger
        // that slides off the row cancels instead of navigating.
        .onEnd((_event, success) => {
            if (success) {
                runOnJS(onSelect)();
            }
        });

    return (
        <Animated.View
            style={[styles.actionWrapper, animatedStyle]}
            pointerEvents={isOpen ? 'auto' : 'none'}
        >
            {/* The whole row is one target -- tapping the label used to do nothing. */}
            <GestureDetector gesture={tap}>
                <View style={styles.actionRow}>
                    <View style={styles.labelWrapper}>
                        <View style={styles.labelShadow} pointerEvents="none" />
                        <View style={styles.labelContainer}>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                        </View>
                    </View>

                    <View style={styles.miniFabWrapper}>
                        <View style={styles.miniFabShadow} pointerEvents="none" />
                        <View
                            style={[
                                styles.miniFab,
                                { backgroundColor: action.color || '#FFF' }
                            ]}
                        >
                            {action.icon}
                        </View>
                    </View>
                </View>
            </GestureDetector>
        </Animated.View>
    );
};

export const FabMenu: React.FC<FabMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const reduceMotion = useReducedMotion();

    // Drives the backdrop and the FAB icon. The rows each run their own staggered copy
    // of this rather than reading it, so their easing stays intact.
    const progress = useSharedValue(0);

    const toggleMenu = () => {
        const opening = !isOpen;

        progress.value = withTiming(opening ? 1 : 0, {
            duration: opening ? OPEN_DURATION : CLOSE_DURATION,
            easing: FAN_EASING,
            reduceMotion: ReduceMotion.Never,
        });

        setIsOpen(opening);
    };

    // Fades in with the rows rather than hard-mounting, which cut in abruptly.
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
    }));

    return (
        // Full-screen host: Android drops touches on children rendered outside their parent's
        // bounds, and the fanned-out rows sit well above the FAB. `box-none` keeps this
        // overlay from swallowing taps meant for the screen underneath.
        <View style={styles.container} pointerEvents="box-none">
            {/* Dimmed backdrop -- visual only, so it can never win a tap over the buttons. */}
            <Animated.View
                style={[styles.backdrop, backdropStyle]}
                pointerEvents="none"
            />

            {/* Action Buttons */}
            {actions.map((action, index) => (
                <FabActionRow
                    key={index}
                    action={action}
                    index={index}
                    isOpen={isOpen}
                    reduceMotion={reduceMotion}
                    onSelect={() => {
                        action.onPress();
                        toggleMenu();
                    }}
                />
            ))}

            {/* Main FAB. Still a TouchableOpacity: it never translates, so none of the
                moving-hit-rect problem the rows were migrated to solve applies to it. */}
            <View style={styles.fabWrapper}>
                <View style={styles.fabShadow} pointerEvents="none" />
                <TouchableOpacity
                    style={styles.fab}
                    onPress={toggleMenu}
                    activeOpacity={0.8}
                >
                    <Animated.View style={iconStyle}>
                        <Plus color="#FFF" size={32} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        zIndex: 999, // Ensure it sits on top
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(255,255,255,0.7)', // Semi-transparent overlay standard for premium feel
    },
    fabWrapper: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: FAB_SIZE,
        height: FAB_SIZE,
    },
    fabShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: FAB_SIZE,
        height: FAB_SIZE,
        backgroundColor: BORDER,
        transform: [{ translateX: SHADOW_OFFSET + 1 }, { translateY: SHADOW_OFFSET + 1 }],
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        backgroundColor: '#1A1A2E', // App theme primary
        borderWidth: 3,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionWrapper: {
        position: 'absolute',
        // Sits just above the FAB (20 bottom + 60 tall - 12 overlap trim), centered on its column:
        // FAB is 60 wide at right:20, mini FAB is 56 -> 2px inset keeps the two columns aligned.
        bottom: 68,
        right: 26,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    labelWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    labelShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: BORDER,
        transform: [{ translateX: SHADOW_OFFSET - 1 }, { translateY: SHADOW_OFFSET - 1 }],
    },
    labelContainer: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: BORDER,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    actionLabel: {
        color: '#333',
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
    },
    miniFabWrapper: {
        position: 'relative',
        width: MINI_FAB_SIZE,
        height: MINI_FAB_SIZE,
    },
    miniFabShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: MINI_FAB_SIZE,
        height: MINI_FAB_SIZE,
        backgroundColor: BORDER,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    miniFab: {
        width: MINI_FAB_SIZE,
        height: MINI_FAB_SIZE,
        borderWidth: 3,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
