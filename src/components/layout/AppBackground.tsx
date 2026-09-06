import React from 'react';
import { StyleSheet, View, ImageBackground, ViewStyle, StyleProp } from 'react-native';

export type BackgroundVariant = 'default' | 'focus' | 'energy' | 'calm';

interface AppBackgroundProps {
    children: React.ReactNode;
    variant?: BackgroundVariant;
    animated?: boolean;
    style?: StyleProp<ViewStyle>;
}

/**
 * Premium Background System for Emotion Tracker
 * Uses a global background image for a consistent, premium look.
 */
export default function AppBackground({
    children,
    style,
}: AppBackgroundProps) {
    return (
        <ImageBackground
            source={require('../../../assets/images/background.png')}
            style={[styles.container, style]}
            resizeMode="cover"
        >
            <View style={styles.content}>{children}</View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFB', // Fallback
    },
    content: {
        flex: 1,
    },
});
