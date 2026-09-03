import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Target, Check, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';

// One note per day: the card resets each morning, which is the point of "today's focus".
const STORAGE_PREFIX = '@mindbright_intentions_';
const todayKey = () => STORAGE_PREFIX + new Date().toISOString().slice(0, 10);

// --- Ruled field geometry -------------------------------------------------
// One row = one ruled line = one line of text, so these have to agree: the rules
// are drawn at the BOTTOM of each row and the text `lineHeight` fills the same
// row, which is what puts the words on the line instead of near it.
const LINE_HEIGHT = 30;   // Height of one row, shared by the rule and the text
const NUM_LINES = 2;      // The card is exactly this tall -- see FIELD_HEIGHT
const FIELD_TOP = 6;      // Gap above the first row; the rule and the text both use it
const FIELD_PAD_H = 2;    // Horizontal inset, shared by the text and the placeholder
const FIELD_HEIGHT = FIELD_TOP + LINE_HEIGHT * NUM_LINES;
const FONT_SIZE = 14;

// A focus line has to fit the two rows above. Silkscreen averages ~9.2px per
// character at this size, so a 360dp screen gives ~28 per row; 48 leaves room for
// what word wrapping loses at the line break. Capping the input is what keeps the
// card from growing, and keeps text from hiding once the field is locked (a
// read-only field cannot be scrolled).
const MAX_CHARS = 48;

const PLACEHOLDER = 'Today I will...';

export default function IntentionCard() {
    const [text, setText] = useState('');
    const [savedText, setSavedText] = useState('');   // Last value written to storage
    const [isEditing, setIsEditing] = useState(true); // Empty card starts open for writing
    const [savedFlash, setSavedFlash] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load today's intention on mount
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(todayKey());
                if (active && stored) {
                    setText(stored);
                    setSavedText(stored);
                    setIsEditing(false); // Already written today -> show it locked, with an EDIT button
                }
            } catch (err) {
                console.log('[IntentionCard] Could not read stored intention:', err);
            }
        })();

        return () => {
            active = false;
            if (flashTimer.current) clearTimeout(flashTimer.current);
        };
    }, []);

    const handleSave = async () => {
        const value = text.trim();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await AsyncStorage.setItem(todayKey(), value);
            setText(value);
            setSavedText(value);
            setIsEditing(false);
            Keyboard.dismiss();

            setSavedFlash(true);
            if (flashTimer.current) clearTimeout(flashTimer.current);
            flashTimer.current = setTimeout(() => setSavedFlash(false), 1800);
        } catch (err) {
            console.log('[IntentionCard] Could not save intention:', err);
        }
    };

    const handleEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSavedFlash(false);
        setIsEditing(true);
        // Wait for the input to become editable before pulling up the keyboard
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const isDirty = isEditing && text.trim() !== savedText;
    const canSave = text.trim().length > 0;

    return (
        <View style={styles.wrapper}>
            {/* Hard offset block = pixel-art drop shadow (no blur) */}
            <View style={styles.pixelShadow} pointerEvents="none" />

            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <Target size={16} color={ACCENT} strokeWidth={2.5} />
                        <Text style={styles.headerEyebrow}>[ MORNING INTENTIONS ]</Text>
                    </View>
                    <Text style={styles.headerTitle}>{"What's your main focus today?"}</Text>
                </View>

                {/* Writing area: fixed height, so the card keeps its size however much is
                    typed. Brighter dotted rule than the dividers, so it still reads as a field. */}
                <View style={styles.inputContainer}>
                    <View style={styles.linesContainer} pointerEvents="none">
                        {Array.from({ length: NUM_LINES }).map((_, i) => (
                            <View key={i} style={styles.lineRow}>
                                <View style={[styles.line, !isEditing && styles.lineLocked]} />
                            </View>
                        ))}
                    </View>

                    {/* Our own placeholder rather than the built-in one: Android does not
                        apply `lineHeight` to a TextInput's placeholder, so the native hint
                        floated above the rule. This Text shares the input's metrics
                        exactly, so it sits on the line on both platforms. */}
                    {text.length === 0 && (
                        <View style={styles.placeholderWrap} pointerEvents="none">
                            <Text style={styles.placeholder}>{PLACEHOLDER}</Text>
                        </View>
                    )}

                    <TextInput
                        ref={inputRef}
                        style={[styles.input, !isEditing && styles.inputLocked]}
                        multiline
                        maxLength={MAX_CHARS}
                        value={text}
                        onChangeText={setText}
                        editable={isEditing}
                        textAlignVertical="top"
                        underlineColorAndroid="transparent"
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerHint}>
                        {savedFlash ? '[ SAVED ]' : isDirty ? 'UNSAVED CHANGES' : 'SAVED ON DEVICE'}
                    </Text>

                    {isEditing ? (
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, !canSave && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={!canSave}
                            activeOpacity={0.8}
                        >
                            <Check size={14} color={PAPER} strokeWidth={3} />
                            <Text style={styles.saveButtonText}>SAVE</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.editButton]}
                            onPress={handleEdit}
                            activeOpacity={0.8}
                        >
                            <Pencil size={14} color={INK} strokeWidth={2.5} />
                            <Text style={styles.editButtonText}>EDIT</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

// Pixel-art palette (keeps the card's amber accent)
const INK = '#78350F';     // Dark amber "ink" outline
const PAPER = '#FFFDF3';   // Warm off-white paper
const RULE = '#E7C98F';    // Muted amber, used only for the locked (read-only) rule
const ACCENT = '#F59E0B';  // Amber accent, used for dividers -- darker, like QuoteCard's footer rule
const BRIGHT = '#FCD34D';  // Bright gold, used only for the active writing rule so it doesn't read as a divider

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginBottom: 16,
        marginRight: 6, // Room for the offset pixel shadow
    },
    pixelShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: INK,
        transform: [{ translateX: 6 }, { translateY: 6 }],
    },
    card: {
        backgroundColor: PAPER,
        padding: 18,
        borderWidth: 3,
        borderColor: INK,
        borderLeftWidth: 10,
        borderLeftColor: ACCENT,
    },
    header: {
        paddingBottom: 10,
        marginBottom: 6,
        borderBottomWidth: 3,
        borderBottomColor: INK,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    headerEyebrow: {
        fontSize: 10,
        color: '#B45309',
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 13,
        color: INK,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 0.5,
        lineHeight: 22,
    },
    inputContainer: {
        position: 'relative',
        height: FIELD_HEIGHT, // Fixed: typing fills the lines, it does not add more
        marginTop: 8,
    },
    linesContainer: {
        ...StyleSheet.absoluteFill,
        paddingTop: FIELD_TOP,
    },
    lineRow: {
        height: LINE_HEIGHT,
        justifyContent: 'flex-end', // Rule sits on the row's baseline edge
    },
    line: {
        borderBottomWidth: 2,
        borderBottomColor: BRIGHT,
        borderStyle: 'dotted',
    },
    lineLocked: {
        // Once saved, the field is no longer active -> mute the rule
        borderBottomWidth: 2,
        borderBottomColor: RULE,
    },
    placeholderWrap: {
        ...StyleSheet.absoluteFill,
        paddingTop: FIELD_TOP,
        paddingHorizontal: FIELD_PAD_H,
    },
    placeholder: {
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        fontFamily: PIXEL,
        color: '#C4A97A',
        includeFontPadding: false, // Android: keep the metrics identical to the input
    },
    input: {
        height: FIELD_HEIGHT,
        padding: 0,             // Clear Android's default inset before setting our own
        paddingTop: FIELD_TOP,
        paddingHorizontal: FIELD_PAD_H,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        fontFamily: PIXEL,
        color: '#3F2A12',       // Ink-brown text
        includeFontPadding: false, // Android: this padding is what pushed text off the rule
    },
    inputLocked: {
        color: INK,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 2,
        // Darker accent rule, matching how QuoteCard darkens its own footer divider
        borderTopColor: ACCENT,
        borderStyle: 'dotted',
    },
    footerHint: {
        flex: 1,
        fontSize: 10,
        color: '#B79A5E',
        fontFamily: PIXEL,
        letterSpacing: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: INK,
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    saveButton: {
        backgroundColor: ACCENT,
    },
    saveButtonText: {
        color: PAPER,
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    editButton: {
        backgroundColor: PAPER,
    },
    editButtonText: {
        color: INK,
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
});
