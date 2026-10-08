
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
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
import { PIXEL, PIXEL_BULLET, TYPE } from '../../constants/typography';
import { PRESS_SINK, SHADOW_OFFSET, BORDER_W } from '../../constants/pixel';
import { SPACE, hitSlopFor } from '../../constants/layout';

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
                                <Pressable
                                    style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                                    onPress={onClose}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close gratitude note"
                                >
                                    <X size={20} color={INK} strokeWidth={2.5} />
                                </Pressable>

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
                                    <Pressable
                                        style={({ pressed }) => [styles.suggestionButton, pressed && styles.pressed]}
                                        onPress={handleSuggestionPress}
                                        hitSlop={FOOTER_SLOP}
                                        accessibilityRole="button"
                                        accessibilityLabel="Show a gratitude prompt"
                                    >
                                        <Lightbulb size={16} color={EYEBROW} />
                                        <Text style={styles.suggestionText}>HINT</Text>
                                    </Pressable>

                                    <Pressable
                                        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                                        onPress={handleSave}
                                        hitSlop={FOOTER_SLOP}
                                        accessibilityRole="button"
                                        accessibilityLabel="Save gratitude note"
                                    >
                                        <Text style={styles.saveButtonText}>SAVE</Text>
                                    </Pressable>
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
const BROWN = '#3F2A12';     // Ink-brown: typed text, and the SAVE label
const EYEBROW = '#B45309';   // Burnt amber for small text on this paper (4.7:1; the accent was 3.0:1)
// The SAVE face is the Intention card's amber, so the two SAVE buttons on Today are one
// button. On the darker #D97706 accent no text colour in this palette reached 4.5:1.
const SAVE_FACE = '#F59E0B';

/** HINT and SAVE are both 36 tall (16 line + 2x8 padding + 2x2 border); the slop takes them to 44. */
const FOOTER_SLOP = { top: hitSlopFor(36), bottom: hitSlopFor(36) };

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30,20,0,0.55)', // Warm dimmed backdrop
        padding: SPACE.xl,
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
    // Square corners and the shared 4px shadow. This note was the one rounded
    // surface in the app (8 / 6 / 4px radii, an 8px shadow).
    pixelShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: INK,
        transform: [{ translateX: SHADOW_OFFSET }, { translateY: SHADOW_OFFSET }],
    },
    paper: {
        backgroundColor: PAPER,
        borderWidth: BORDER_W,
        borderColor: INK,
        paddingHorizontal: SPACE.xl,
        paddingVertical: SPACE.lg,
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
    },
    pressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
    },
    closeButton: {
        position: 'absolute',
        top: SPACE.md,
        right: SPACE.md,
        zIndex: 10,
        width: 30,
        height: 30,
        borderWidth: 2,
        borderColor: INK,
        backgroundColor: PAPER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        paddingBottom: SPACE.md,
        marginBottom: SPACE.sm,
        // Clears the close button: it sits 12px in from the paper's edge and is 30
        // wide, so it reaches 18px past the 24px padding; 32 leaves a gap after it.
        marginRight: SPACE.xxl,
        borderBottomWidth: BORDER_W,
        borderBottomColor: INK,
    },
    headerEyebrow: {
        ...TYPE.label,
        color: EYEBROW,
        letterSpacing: 2,
        marginBottom: SPACE.xs,
    },
    headerTitle: {
        ...TYPE.h3,
        color: INK,
        letterSpacing: 0.5,
    },
    inputContainer: {
        position: 'relative',
        height: FIELD_HEIGHT, // Fixed: typing fills the lines, it does not add more
        marginTop: SPACE.sm,
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
    // The ruled field keeps its own 14-on-30 metrics: the rules are drawn at
    // LINE_HEIGHT, so the text has to sit on exactly that grid.
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
        color: BROWN,
        includeFontPadding: false, // Android: this padding is what pushed text off the rules
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACE.md,
        paddingTop: SPACE.md,
        borderTopWidth: BORDER_W,
        borderTopColor: INK,
    },
    suggestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACE.sm,
        paddingHorizontal: SPACE.md,
        backgroundColor: '#FFFDF3',
        borderWidth: 2,
        borderColor: INK,
    },
    suggestionText: {
        ...TYPE.label,
        marginLeft: SPACE.xs,
        color: EYEBROW,
    },
    saveButton: {
        backgroundColor: SAVE_FACE,
        paddingVertical: SPACE.sm,
        paddingHorizontal: SPACE.xl,
        borderWidth: 2,
        borderColor: INK,
    },
    saveButtonText: {
        ...TYPE.label,
        color: BROWN,
    },
    suggestionPopup: {
        position: 'absolute',
        bottom: 78,
        right: 18,
        backgroundColor: '#FFFDF3',
        paddingVertical: SPACE.sm,
        paddingHorizontal: SPACE.md,
        borderWidth: 2,
        borderColor: INK,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 220,
    },
    popupText: {
        ...TYPE.body,
        color: INK,
        textAlign: 'center',
    }
});
