import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import PixelCard from './PixelCard';
import SecondaryButton from './SecondaryButton';
import { TYPE } from '../../constants/typography';
import { SPACE } from '../../constants/layout';

interface EmptyStateProps {
    /** A lucide icon, drawn in INK_MUTED by the caller. */
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    buttonLabel?: string;
    onButtonPress?: () => void;
    /**
     * No card of its own -- for a state that renders inside a card that is already
     * on screen (the goals ring card, the chart card).
     */
    bare?: boolean;
    style?: StyleProp<ViewStyle>;
}

/**
 * The one way the app says "nothing here" or "this didn't load": an icon, a title,
 * a line of explanation, and a quiet button.
 *
 * The button is always a SecondaryButton. An empty state is not a screen's primary
 * action -- on Goals, the pinned NEW GOAL button already is, and two primaries
 * stacked on one screen is one too many.
 */
export default function EmptyState({
    icon,
    title,
    subtitle,
    buttonLabel,
    onButtonPress,
    bare = false,
    style,
}: EmptyStateProps) {
    const content = (
        <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {!!buttonLabel && onButtonPress && (
                <SecondaryButton label={buttonLabel} onPress={onButtonPress} style={styles.button} />
            )}
        </>
    );

    if (bare) {
        return <View style={[styles.bare, style]}>{content}</View>;
    }

    return (
        <PixelCard padding={SPACE.xl} style={styles.card} wrapperStyle={style}>
            {content}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
    },
    bare: {
        alignItems: 'center',
        paddingVertical: SPACE.lg,
    },
    icon: {
        marginBottom: SPACE.md,
    },
    title: {
        ...TYPE.h3,
        textAlign: 'center',
    },
    subtitle: {
        ...TYPE.body,
        textAlign: 'center',
        marginTop: SPACE.sm,
    },
    button: {
        marginTop: SPACE.lg,
    },
});
