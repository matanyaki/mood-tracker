import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';

export interface FabAction {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    color?: string; // Optional background color for the mini FAB
}

interface FabMenuProps {
    actions: FabAction[];
}

// Monospace face keeps the label consistent with the rest of the app's pixel-art cards
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// Pixel-art palette: flat black outline + hard offset shadow (no blur, no radius)
const BORDER = '#000000';
const SHADOW_OFFSET = 4;

const FAB_SIZE = 60;
const MINI_FAB_SIZE = 56;
const ROW_SPACING = 60; // Vertical distance between fanned-out rows

export const FabMenu: React.FC<FabMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;

        // A bouncy spring kept the rows drifting for a few hundred ms after they looked
        // settled, so a tap landing mid-wobble got cancelled (the button moved out from
        // under the finger between press-down and release). A short, non-overshooting
        // timing curve settles deterministically instead.
        // useNativeDriver is off on purpose: the native driver leaves the JS-side layout
        // stale, so press hit-rects were measured against stale positions.
        Animated.timing(animation, {
            toValue,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();

        setIsOpen(!isOpen);
    };

    const rotation = {
        transform: [
            {
                rotate: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                }),
            },
        ],
    };

    const getStyleForIndex = (index: number) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -ROW_SPACING * (index + 1)],
        });

        const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });

        return {
            transform: [{ translateY }],
            opacity,
        };
    };

    return (
        // Full-screen host: Android drops touches on children rendered outside their parent's
        // bounds, and the fanned-out rows sit well above the FAB. `box-none` keeps this
        // overlay from swallowing taps meant for the screen underneath.
        <View style={styles.container} pointerEvents="box-none">
            {/* Dimmed backdrop -- visual only, so it can never win a tap over the buttons. */}
            {isOpen && <View style={styles.backdrop} pointerEvents="none" />}

            {/* Action Buttons */}
            {actions.map((action, index) => (
                <Animated.View
                    key={index}
                    style={[styles.actionWrapper, getStyleForIndex(index)]}
                    pointerEvents={isOpen ? 'auto' : 'none'}
                >
                    {/* The whole row is one target -- tapping the label used to do nothing.
                        Fires on press-in so a press can't be cancelled between down and up. */}
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPressIn={() => {
                            action.onPress();
                            toggleMenu();
                        }}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
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
                    </TouchableOpacity>
                </Animated.View>
            ))}

            {/* Main FAB */}
            <View style={styles.fabWrapper}>
                <View style={styles.fabShadow} pointerEvents="none" />
                <TouchableOpacity
                    style={styles.fab}
                    onPress={toggleMenu}
                    activeOpacity={0.8}
                >
                    <Animated.View style={rotation}>
                        <Plus color="#FFF" size={32} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999, // Ensure it sits on top
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
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
        fontWeight: '700',
        fontSize: 13,
        fontFamily: MONO,
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
