import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { TYPE } from '../../constants/typography';
import { ROW_PADDING_H, ROW_PADDING_V, SPACE } from '../../constants/layout';
import { OUTLINE, INK, INK_MUTED, PRESSED, BORDER_W_INNER } from '../../constants/pixel';

interface MenuRowProps {
    icon: LucideIcon;
    label: string;
    /** Icon and label colour. Must hold 4.5:1 on PAPER -- it is the label's text colour. */
    color?: string;
    /** Flat fill behind the icon. */
    tint: string;
    onPress: () => void;
    disabled?: boolean;
    /** No divider under the last row of a card. */
    isLast?: boolean;
    /** The trailing chevron, for a row that opens somewhere. */
    showChevron?: boolean;
}

/**
 * One row of a settings card: tinted icon box, label, chevron.
 *
 * The icon tints are flat opaque swatches rather than the `color + '15'` the row
 * used to build: an eight-digit hex is a translucent fill, and it takes its
 * lightness from whatever happens to be behind it.
 */
export default function MenuRow({
    icon: Icon,
    label,
    color = INK,
    tint,
    onPress,
    disabled = false,
    isLast = false,
    showChevron = true,
}: MenuRowProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
                styles.row,
                !isLast && styles.rowDivided,
                pressed && styles.rowPressed,
            ]}
        >
            <View style={[styles.iconBox, { backgroundColor: tint }]}>
                <Icon size={18} color={color} strokeWidth={2.5} />
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
            {showChevron && <ChevronRight size={16} color={INK_MUTED} strokeWidth={3} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md,
        paddingVertical: ROW_PADDING_V,
        paddingHorizontal: ROW_PADDING_H,
    },
    rowDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    rowPressed: {
        backgroundColor: PRESSED,
    },
    iconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    label: {
        ...TYPE.label,
        flex: 1,
    },
});
