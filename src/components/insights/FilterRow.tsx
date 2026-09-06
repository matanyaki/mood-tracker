import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Modal, Dimensions,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED,
    SHADOW_OFFSET, BORDER_W, BORDER_W_INNER,
} from '../../constants/pixel';

interface FilterRowProps {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    years: string[];
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const screenHeight = Dimensions.get('window').height;

/** One option row. Fixed, so the open panel can scroll to a row by arithmetic. */
const ITEM_H = 38;
/** Roughly six rows -- past that the panel starts covering the chart it filters. */
const PANEL_MAX_H = 240;
/** Air between the trigger and the panel it drops. */
const PANEL_GAP = 6;
/** Closest the panel is allowed to come to a screen edge. */
const SCREEN_MARGIN = 16;

interface Option {
    label: string;
    value: string;
}

interface PixelSelectProps {
    eyebrow: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    /** Share of the row this control takes, against its sibling. */
    flex: number;
}

/**
 * A drop-down drawn as pixel art: a square outlined trigger that opens a
 * scrolling panel of options directly beneath itself.
 *
 * The panel lives in a Modal rather than absolutely under the trigger because
 * the whole control sits inside the screen's vertical ScrollView, and Android
 * clips a child that overflows its scrolling parent -- the list would have been
 * cut off at the first row. The trigger is measured in window coordinates on
 * press and the panel is placed at those coordinates, so it still reads as
 * having dropped out of the button.
 */
function PixelSelect({ eyebrow, options, value, onChange, flex }: PixelSelectProps) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef<View>(null);
    const listRef = useRef<ScrollView>(null);

    const selectedIndex = options.findIndex(o => o.value === value);
    const selectedLabel = options[selectedIndex]?.label ?? '';

    const handleOpen = useCallback(() => {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setOpen(true);
        });
    }, []);

    // A late option opens below the fold of a six-row panel, so the list is
    // scrolled to put it in view -- one row above it, as a handle for the
    // options before it. Rows are a fixed height, so this needs no measure pass.
    useEffect(() => {
        if (!open) return;
        const y = Math.max(0, (selectedIndex - 1) * ITEM_H);
        listRef.current?.scrollTo({ y, animated: false });
    }, [open, selectedIndex]);

    const panelHeight = Math.min(PANEL_MAX_H, options.length * ITEM_H) + BORDER_W * 2;
    const below = anchor.y + anchor.height + PANEL_GAP;
    // Flips above the trigger when there is not enough room under it, which is
    // what happens to the year control on a short screen.
    const flipUp = below + panelHeight > screenHeight - SCREEN_MARGIN;
    const panelTop = flipUp
        ? Math.max(SCREEN_MARGIN, anchor.y - panelHeight - PANEL_GAP)
        : below;

    return (
        <View style={{ flex }}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>

            <View
                // The shadow block is drawn by a sibling of the pressable rather
                // than the pressable itself, so it stays put while the face sinks.
                ref={triggerRef}
                collapsable={false}
                style={styles.triggerWrapper}
            >
                <View style={styles.triggerShadow} pointerEvents="none" />

                <Pressable
                    onPress={handleOpen}
                    style={({ pressed }) => [
                        styles.trigger,
                        open && styles.triggerOpen,
                        pressed && !open && styles.triggerPressed,
                    ]}
                >
                    <Text style={styles.triggerText} numberOfLines={1}>
                        {selectedLabel.toUpperCase()}
                    </Text>
                    {/* Silkscreen has no triangle glyph -- a typed one renders as a
                        tofu box -- so the caret is an icon, the same way the diary
                        calendar draws its month arrows. */}
                    <ChevronDown
                        size={14}
                        color={INK}
                        strokeWidth={3}
                        style={open ? styles.caretOpen : undefined}
                    />
                </Pressable>
            </View>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
                // Without this the modal starts below the status bar on Android
                // while measureInWindow reports coordinates that include it, and
                // the panel lands a status bar's height too low.
                statusBarTranslucent
            >
                <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
                    <View
                        style={[
                            styles.panelWrapper,
                            {
                                top: panelTop,
                                left: anchor.x,
                                // The face gives up SHADOW_OFFSET to its shadow block,
                                // so the wrapper runs wide by exactly that much to
                                // leave the face flush with the trigger above it.
                                width: anchor.width + SHADOW_OFFSET,
                                height: panelHeight,
                            },
                        ]}
                    >
                        <View style={styles.panelShadow} pointerEvents="none" />

                        <View style={styles.panel}>
                            <ScrollView
                                ref={listRef}
                                showsVerticalScrollIndicator={false}
                                // Taps land on the rows rather than being eaten by
                                // the overlay press that closes the panel.
                                keyboardShouldPersistTaps="handled"
                            >
                                {options.map((option, i) => {
                                    const isSelected = option.value === value;
                                    const isLast = i === options.length - 1;

                                    return (
                                        <Pressable
                                            key={option.value}
                                            onPress={() => {
                                                onChange(option.value);
                                                setOpen(false);
                                            }}
                                            style={({ pressed }) => [
                                                styles.item,
                                                !isLast && styles.itemDivided,
                                                isSelected && styles.itemSelected,
                                                pressed && !isSelected && styles.itemPressed,
                                            ]}
                                        >
                                            {/* Drawn as a block rather than typed: the
                                                check and diamond characters this would
                                                otherwise use have no glyph in Silkscreen. */}
                                            <View
                                                style={[
                                                    styles.itemMarker,
                                                    isSelected && styles.itemMarkerOn,
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    isSelected && styles.itemTextSelected,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {option.label.toUpperCase()}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

/**
 * Month and year selection for InsightsScreen.
 *
 * The @react-native-picker/picker dropdowns this replaces render as native
 * controls -- a rounded iOS wheel and a Material dialog -- and neither takes a
 * square outline or the pixel face, so there was no way to style them into the
 * rest of the screen. These are drawn by us, so they can be.
 */
export const FilterRow = React.memo(function FilterRow({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    years
}: FilterRowProps) {
    const monthOptions = MONTH_NAMES.map((label, i) => ({
        label,
        value: (i + 1).toString(),
    }));

    const yearOptions = years.map(y => ({ label: y, value: y }));

    return (
        <View style={styles.container}>
            {/* Month runs wider: "SEPTEMBER" is nine characters of a typeface that
                draws ~0.76em per character, against four for any year. */}
            <PixelSelect
                eyebrow="[ MONTH ]"
                options={monthOptions}
                value={selectedMonth}
                onChange={setSelectedMonth}
                flex={1.7}
            />
            <PixelSelect
                eyebrow="[ YEAR ]"
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                flex={1}
            />
        </View>
    );
});

FilterRow.displayName = 'FilterRow';

export default FilterRow;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    eyebrow: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 8,
    },
    triggerWrapper: {
        position: 'relative',
        marginRight: SHADOW_OFFSET, // Room for the offset shadow
    },
    triggerShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    trigger: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 12,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    triggerOpen: {
        // Held down for as long as the panel hangs off it, so the two read as one
        // object rather than a button and a floating list.
        backgroundColor: '#EDE9E0',
    },
    triggerPressed: {
        backgroundColor: '#DDE3EA',
    },
    triggerText: {
        flex: 1,
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    caretOpen: {
        // Whole-pixel flip, no rotation: an arbitrary angle would resample the
        // icon's strokes and soften the one edge this style cannot afford to lose.
        transform: [{ scaleY: -1 }],
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    panelWrapper: {
        position: 'absolute',
    },
    panelShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: OUTLINE,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
        // The block is cast by the face, which is SHADOW_OFFSET narrower than the
        // wrapper, so it gives up the same width here instead of running past it.
        right: SHADOW_OFFSET,
    },
    panel: {
        flex: 1,
        marginRight: SHADOW_OFFSET,
        backgroundColor: PAPER,
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
    },
    item: {
        height: ITEM_H,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
    },
    itemDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    itemSelected: {
        // Inverted rather than tinted: a pixel control says "on" by swapping ink
        // and paper, which survives at any size and needs no second colour.
        backgroundColor: INK,
    },
    itemPressed: {
        backgroundColor: '#DDE3EA',
    },
    itemMarker: {
        width: 8,
        height: 8,
        borderWidth: 2,
        borderColor: OUTLINE,
    },
    itemMarkerOn: {
        backgroundColor: PAPER,
        borderColor: PAPER,
    },
    itemText: {
        flex: 1,
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    itemTextSelected: {
        fontFamily: PIXEL_BOLD,
        color: PAPER,
    },
});
