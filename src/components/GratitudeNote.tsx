
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Animated,
    Easing,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Lightbulb, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PIXEL, PIXEL_BOLD, PIXEL_BULLET } from '../constants/typography';

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

// --- Ruled field geometry -------------------------------------------------
// One row = one ruled line = one line of text, so these three have to agree:
// the rules are drawn at the BOTTOM of each row and the text `lineHeight` fills
// the same row, which is what puts the words on the line instead of near it.
const LINE_HEIGHT = 30;   // Height of one row, shared by the rules and the text
const NUM_LINES = 6;      // The note is exactly this tall -- see FIELD_HEIGHT
const FIELD_TOP = 6;      // Gap above the first row; the rules and the text both use it
const FIELD_PAD_H = 2;    // Horizontal inset, shared by the text and the placeholder
const FIELD_HEIGHT = FIELD_TOP + LINE_HEIGHT * NUM_LINES;
const FONT_SIZE = 14;

const PLACEHOLDER = 'I am grateful for...';
const BULLET = PIXEL_BULLET; // Silkscreen has no block/diamond glyph -- bullet it is

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
    const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // A pending auto-hide must not fire after the note is gone.
    useEffect(() => () => {
        if (hintTimer.current) {
            clearTimeout(hintTimer.current);
        }
    }, []);

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
            easing: Easing.bezier(0.23, 1, 0.32, 1),
            useNativeDriver: true,
        }).start();

        // Auto-hide after a few seconds. Tapping HINT again restarts the countdown
        // instead of stacking a second timer on top of the first.
        if (hintTimer.current) {
            clearTimeout(hintTimer.current);
        }
        hintTimer.current = setTimeout(() => {
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
            .filter(line => line !== '' && line !== BULLET.trim())
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
                                    <Text style={styles.headerEyebrow}>[ GRATITUDE ]</Text>
                                    <Text style={styles.headerTitle}>What are you{'\n'}thankful for today?</Text>
                                </View>

                                {/* Lined Input Area -- fixed height, so the note never
                                    outgrows the ruled lines drawn behind it. */}
                                <View style={styles.inputContainer}>
                                    {/* Background ruled lines */}
                                    <View style={styles.linesContainer} pointerEvents="none">
                                        {Array.from({ length: NUM_LINES }).map((_, i) => (
                                            <View key={i} style={styles.lineRow}>
                                                <View style={styles.line} />
                                            </View>
                                        ))}
                                    </View>

                                    {/* Our own placeholder rather than the built-in one:
                                        Android does not apply `lineHeight` to a TextInput's
                                        placeholder, so the native hint floated above the
                                        first rule. This Text shares the input's metrics
                                        exactly, so it sits on the line on both platforms. */}
                                    {text.length === 0 && (
                                        <View style={styles.placeholderWrap} pointerEvents="none">
                                            <Text style={styles.placeholder}>{PLACEHOLDER}</Text>
                                        </View>
                                    )}

                                    <TextInput
                                        style={styles.input}
                                        multiline
                                        scrollEnabled
                                        value={text}
                                        onChangeText={handleChangeText}
                                        textAlignVertical="top"
                                        underlineColorAndroid="transparent"
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
                                    // The tilt rides in the animated array on purpose: an
                                    // inline `transform` replaces the stylesheet's whole
                                    // array, so a rotate left behind there would be dropped.
                                    <Animated.View
                                        style={[
                                            styles.suggestionPopup,
                                            {
                                                opacity: fadeAnim,
                                                transform: [
                                                    { rotate: '-2deg' },
                                                    {
                                                        translateY: fadeAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [6, 0],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
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
        ...StyleSheet.absoluteFill,
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
        ...StyleSheet.absoluteFill,
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
        fontSize: 10,
        color: ACCENT,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 2,
        marginBottom: 6,
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
        marginTop: 6,
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
        borderBottomColor: RULE,
        // Dotted rule reads more "pixel"
        borderStyle: 'dotted',
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
        color: '#B79A5E',
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
        includeFontPadding: false, // Android: this padding is what pushed text off the rules
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
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
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
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
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
    },
    popupText: {
        color: INK,
        fontSize: 11,
        lineHeight: 18,
        fontFamily: PIXEL,
        textAlign: 'center',
    }
});
