import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
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
                        <View style={styles.labelContainer}>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                        </View>
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
                    </Animated.View>
                ))}
            </View>

            {/* Main FAB */}
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
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        right: 30,
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
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1A1A2E', // App theme primary
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 10,
        right: 0, // Align with center of main FAB
        alignItems: 'flex-end', // Items align to the right
        marginBottom: 60, // Space for the main FAB
    },
    actionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 16, // Spacing between items
        position: 'absolute',
        right: 5, // Center align relative to FAB width (60) -> center is 30. Mini FAB is 48 -> center is 24. Offset ~6px.
        bottom: 0,
    },
    labelContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginRight: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionLabel: {
        color: '#333',
        fontWeight: '600',
        fontSize: 14,
    },
    miniFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
});
