import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Target, Check, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// One note per day: the card resets each morning, which is the point of "today's focus".
const STORAGE_PREFIX = '@mindbright_intentions_';
const todayKey = () => STORAGE_PREFIX + new Date().toISOString().slice(0, 10);

const LINE_HEIGHT = 34;       // Row height for both the ruled line and the text (kept in sync so words sit on the line)
const INPUT_PADDING_TOP = 10; // Must match linesContainer paddingTop so text baselines land on the rule
const NUM_LINES = 1;

// Monospace face gives the card a pixel / typewriter feel (matches GratitudeNote)
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

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
                        <Text style={styles.headerEyebrow}>◆ MORNING INTENTIONS ◆</Text>
                    </View>
                    <Text style={styles.headerTitle}>{"What's your main focus today?"}</Text>
                </View>

                {/* Writing area: brighter dotted rule than the dividers, so it still reads as a field */}
                <View style={styles.inputContainer}>
                    <View style={styles.linesContainer} pointerEvents="none">
                        {Array.from({ length: NUM_LINES }).map((_, i) => (
                            <View key={i} style={styles.lineRow}>
                                <View style={[styles.line, !isEditing && styles.lineLocked]} />
                            </View>
                        ))}
                    </View>

                    <TextInput
                        ref={inputRef}
                        style={[styles.input, !isEditing && styles.inputLocked]}
                        multiline
                        placeholder="Today I will..."
                        placeholderTextColor="#C4A97A"
                        value={text}
                        onChangeText={setText}
                        editable={isEditing}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerHint}>
                        {savedFlash ? '✓ SAVED' : isDirty ? 'UNSAVED CHANGES' : 'SAVED ON THIS DEVICE'}
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
        ...StyleSheet.absoluteFillObject,
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
        fontSize: 11,
        fontWeight: '700',
        color: '#B45309',
        fontFamily: MONO,
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: INK,
        fontFamily: MONO,
        letterSpacing: 0.5,
        lineHeight: 24,
    },
    inputContainer: {
        position: 'relative',
        minHeight: LINE_HEIGHT * NUM_LINES,
        marginTop: 8,
    },
    linesContainer: {
        ...StyleSheet.absoluteFillObject,
        paddingTop: INPUT_PADDING_TOP,
    },
    lineRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: LINE_HEIGHT,
        width: '100%',
    },
    line: {
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: BRIGHT,
        borderStyle: 'dotted',
    },
    lineLocked: {
        // Once saved, the field is no longer active -> mute the rule
        borderBottomWidth: 2,
        borderBottomColor: RULE,
    },
    input: {
        fontSize: 17,
        lineHeight: LINE_HEIGHT,
        color: '#3F2A12', // Ink-brown text
        paddingTop: INPUT_PADDING_TOP,
        paddingBottom: 6,
        paddingHorizontal: 2,
        fontFamily: MONO,
        fontWeight: '700',
        letterSpacing: 0.4,
        minHeight: LINE_HEIGHT * NUM_LINES,
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
        fontFamily: MONO,
        fontWeight: '700',
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
        fontSize: 13,
        fontWeight: '700',
        fontFamily: MONO,
        letterSpacing: 1,
    },
    editButton: {
        backgroundColor: PAPER,
    },
    editButtonText: {
        color: INK,
        fontSize: 13,
        fontWeight: '700',
        fontFamily: MONO,
        letterSpacing: 1,
    },
});
