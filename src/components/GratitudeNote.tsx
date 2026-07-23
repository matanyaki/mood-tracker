
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Animated,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Lightbulb, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Gratitude prompts for the suggestion feature
const GRATITUDE_PROMPTS = [
    "A small win from work",
    "A person who made you laugh",
    "A delicious meal you had recently",
    "Something beautiful you saw outside",
    "A challenge you overcame",
    "A memory that brings you joy",
    "A skill you are proud of",
    "A moment of peace today",
    "Someone who supported you recently",
    "A favorite song or book"
];

const LINE_HEIGHT = 32;       // Row height for both ruled lines and text (kept in sync so words sit on the lines)
const INPUT_PADDING_TOP = 14; // Must match linesContainer paddingTop so text baselines land on the rules
const NUM_LINES = 6;
const BULLET = '■  '; // Pixel-block bullet prefix so the note reads as a retro list

// Monospace face gives the whole note a pixel / typewriter feel
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

interface GratitudeNoteProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (text: string) => void;
    initialText?: string;
}

export const GratitudeNote: React.FC<GratitudeNoteProps> = ({
    visible,
    onClose,
    onSave,
    initialText = ''
}) => {
    const [text, setText] = useState(initialText);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [suggestionText, setSuggestionText] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));

    const handleSuggestionPress = () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Pick a random prompt
        const randomPrompt = GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)];
        setSuggestionText(randomPrompt);
        setShowSuggestion(true);

        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto-hide after a few seconds
        setTimeout(() => {
            closeSuggestion();
        }, 4000);
    };

    const closeSuggestion = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setShowSuggestion(false));
    };

    // Turn the note into a bullet list: prefix the first line and every new line.
    const handleChangeText = (newText: string) => {
        // First character on an empty note → start the first bullet
        if (text.length === 0 && newText.length > 0 && !newText.startsWith(BULLET)) {
            setText(BULLET + newText);
            return;
        }
        // User pressed Enter (newline added at the end) → start a new bullet line
        if (newText.length > text.length && newText.endsWith('\n')) {
            setText(newText + BULLET);
            return;
        }
        setText(newText);
    };

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Save as a single string: keep bullets, drop empty/trailing bullet-only lines
        const cleaned = text
            .split('\n')
            .map(line => line.replace(/\s+$/, ''))
            .filter(line => line !== '' && line !== BULLET.trim() && line !== BULLET.trimEnd())
            .join('\n');

        if (onSave) {
            onSave(cleaned);
        }
        // Clear the note so it opens fresh next time (only on save)
        setText('');
        // Close modal after save
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    {/* Backdrop -> Close on tap */}
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>

                    {/* The Paper Note */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardView}
                    >
                        <View style={styles.paperWrapper}>
                            {/* Hard offset block = pixel-art drop shadow (no blur) */}
                            <View style={styles.pixelShadow} pointerEvents="none" />

                            <View style={styles.paper}>

                                {/* Close Button (X) */}
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={onClose}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <X size={20} color="#78350F" strokeWidth={2.5} />
                                </TouchableOpacity>

                                <View style={styles.header}>
                                    <Text style={styles.headerEyebrow}>◆ GRATITUDE ◆</Text>
                                    <Text style={styles.headerTitle}>What are you{'\n'}thankful for today?</Text>
                                </View>

                                {/* Lined Input Area */}
                                <View style={styles.inputContainer}>
                                    {/* Background ruled lines */}
                                    <View style={styles.linesContainer} pointerEvents="none">
                                        {Array.from({ length: NUM_LINES }).map((_, i) => (
                                            <View key={i} style={styles.lineRow}>
                                                <View style={styles.line} />
                                            </View>
                                        ))}
                                    </View>

                                    <TextInput
                                        style={styles.input}
                                        multiline
                                        placeholder="I am grateful for..."
                                        placeholderTextColor="#B79A5E"
                                        value={text}
                                        onChangeText={handleChangeText}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Footer Actions */}
                                <View style={styles.footer}>
                                    <TouchableOpacity
                                        style={styles.suggestionButton}
                                        onPress={handleSuggestionPress}
                                        activeOpacity={0.7}
                                    >
                                        <Lightbulb size={16} color="#D97706" />
                                        <Text style={styles.suggestionText}>HINT</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSave}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.saveButtonText}>SAVE</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Suggestion Popup Overlay */}
                                {showSuggestion && (
                                    <Animated.View style={[styles.suggestionPopup, { opacity: fadeAnim }]}>
                                        <Text style={styles.popupText}>{suggestionText}</Text>
                                    </Animated.View>
                                )}
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Pixel-art palette
const INK = '#78350F';       // Dark amber "ink" outline
const PAPER = '#FFF7DB';     // Warm cream paper
const RULE = '#E7C98F';      // Ruled-line amber
const ACCENT = '#D97706';    // Amber accent

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30,20,0,0.55)', // Warm dimmed backdrop
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    paperWrapper: {
        width: '100%',
        maxWidth: 380,
        position: 'relative',
    },
    pixelShadow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: INK,
        borderRadius: 8,
        transform: [{ translateX: 8 }, { translateY: 8 }],
    },
    paper: {
        backgroundColor: PAPER,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: INK,
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 18,
        minHeight: 340,
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 30,
        height: 30,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: INK,
        backgroundColor: PAPER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        paddingBottom: 12,
        marginBottom: 6,
        marginRight: 36, // Space for close button
        borderBottomWidth: 3,
        borderBottomColor: INK,
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: ACCENT,
        fontFamily: MONO,
        letterSpacing: 3,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: INK,
        fontFamily: MONO,
        letterSpacing: 0.5,
        lineHeight: 26,
    },
    inputContainer: {
        position: 'relative',
        minHeight: LINE_HEIGHT * NUM_LINES,
        marginTop: 6,
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
        borderBottomColor: RULE,
        // Dotted rule reads more "pixel"
        borderStyle: 'dotted',
    },
    input: {
        fontSize: 16,
        lineHeight: LINE_HEIGHT,
        color: '#3F2A12', // Ink-brown text
        paddingTop: INPUT_PADDING_TOP,
        paddingBottom: 8,
        fontFamily: MONO,
        fontWeight: '600',
        minHeight: LINE_HEIGHT * NUM_LINES,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 3,
        borderTopColor: INK,
    },
    suggestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFDF3',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: INK,
    },
    suggestionText: {
        marginLeft: 6,
        color: ACCENT,
        fontSize: 13,
        fontWeight: '700',
        fontFamily: MONO,
        letterSpacing: 1,
    },
    saveButton: {
        backgroundColor: ACCENT,
        paddingVertical: 10,
        paddingHorizontal: 26,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: INK,
    },
    saveButtonText: {
        color: '#FFF7DB',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: MONO,
        letterSpacing: 1,
    },
    suggestionPopup: {
        position: 'absolute',
        bottom: 78,
        right: 18,
        backgroundColor: '#FFFDF3',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: INK,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 220,
        transform: [{ rotate: '-2deg' }],
    },
    popupText: {
        color: INK,
        fontSize: 13,
        fontFamily: MONO,
        fontWeight: '600',
        textAlign: 'center',
    }
});
