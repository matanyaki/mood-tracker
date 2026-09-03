import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { PIXEL_BOLD } from '../constants/typography';

interface PrimaryButtonProps {
    onPress: () => void;
    label: string;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    onPress,
    label,
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                style,
                (disabled || loading) && styles.disabled
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    {icon && icon}
                    <Text style={[styles.text, textStyle, icon ? { marginLeft: 8 } : undefined]}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#10B981', // Default Green (CheckIn style) -> Override for Reflection (Dark Blue)
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
    },
    disabled: {
        backgroundColor: '#CBD5E1', // Default Disabled Gray
        opacity: 0.8,
        shadowOpacity: 0,
        elevation: 0,
    },
    text: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: PIXEL_BOLD,
    },
});
