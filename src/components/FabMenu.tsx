import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, Platform } from 'react-native';
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

export const FabMenu: React.FC<FabMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;

        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
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
            outputRange: [0, -60 * (index + 1)],
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
        <View style={styles.container}>
            {/* Backdrop to close menu when clicking outside */}
            {isOpen && (
                <TouchableWithoutFeedback onPress={toggleMenu}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                    <Animated.View
                        key={index}
                        style={[styles.actionWrapper, getStyleForIndex(index)]}
                    >
                        <View style={styles.labelWrapper}>
                            <View style={styles.labelShadow} pointerEvents="none" />
                            <View style={styles.labelContainer}>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </View>
                        </View>

                        <View style={styles.miniFabWrapper}>
                            <View style={styles.miniFabShadow} pointerEvents="none" />
                            <TouchableOpacity
                                style={[
                                    styles.miniFab,
                                    { backgroundColor: action.color || '#FFF' }
                                ]}
                                onPress={() => {
                                    action.onPress();
                                    toggleMenu();
                                }}
                                activeOpacity={0.8}
                            >
                                {action.icon}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ))}
            </View>

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
        position: 'absolute',
        bottom: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 999, // Ensure it sits on top
    },
    backdrop: {
        position: 'absolute',
        top: -1000, // Extend comfortably to cover screen
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'rgba(255,255,255,0.7)', // Semi-transparent overlay standard for premium feel
    },
    fabWrapper: {
        position: 'relative',
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
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0, // Align with center of main FAB
        alignItems: 'flex-end', // Items align to the right
        marginBottom: 40, // Space for the main FAB, kept tight so the list sits close to it
    },
    actionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 8, // Spacing between items
        position: 'absolute',
        right: 6, // Center align relative to FAB width (68) -> center is 34. Mini FAB is 56 -> center is 28. Offset ~6px.
        bottom: 0,
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
