
import React, { useState, useEffect } from 'react';
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

const LINE_HEIGHT = 36; // Reduced height to shrink text cursor and make paper lines tighter

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

    // Reset text when opened if needed, or keep state? 
    // Let's keep state for now, but maybe reset if saved.

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

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (onSave) {
            onSave(text);
        }
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
                        <View style={styles.paper}>

                            {/* Close Button (X) */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <X size={24} color="#78350F" />
                            </TouchableOpacity>

                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>What are you thankful for today?</Text>
                            </View>

                            {/* Lined Input Area */}
                            <View style={styles.inputContainer}>
                                {/* Background Lines & Aligned Holes */}
                                <View style={styles.linesContainer} pointerEvents="none">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <View key={i} style={styles.lineRow}>
                                            <View style={styles.hole} />
                                            <View style={styles.line} />
                                        </View>
                                    ))}
                                </View>

                                <TextInput
                                    style={styles.input}
                                    multiline
                                    placeholder="I am grateful for..."
                                    placeholderTextColor="#9CA3AF"
                                    value={text}
                                    onChangeText={setText}
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
                                    <Lightbulb size={18} color="#F59E0B" />
                                    <Text style={styles.suggestionText}>Suggestion</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Suggestion Popup Overlay */}
                            {showSuggestion && (
                                <Animated.View style={[styles.suggestionPopup, { opacity: fadeAnim }]}>
                                    <Text style={styles.popupText}>"{suggestionText}"</Text>
                                </Animated.View>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    paper: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFBE6', // Cream Soft Yellow
        borderRadius: 16,
        padding: 20,
        paddingLeft: 30, // Space for holes
        paddingBottom: 20,
        minHeight: 350,
        // Drop Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#FDE68A', // Soft Amber border
        position: 'relative',
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
        opacity: 0.6,
    },
    hole: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#9CA3AF', // Darker gray to simulate hole
        opacity: 0.25,
        marginLeft: -20, // Sit perfectly in the left paper padding
        marginRight: 10,
        marginBottom: 4, // Lift slightly above bottom line
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    header: {
        marginBottom: 0,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#FCA5A5', // Red margin line
        marginRight: 20, // Space for close button
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#78350F', // Dark Amber/Brown
        fontFamily: Platform.OS === 'ios' ? 'American Typewriter' : 'serif',
        letterSpacing: 0.5,
    },
    inputContainer: {
        position: 'relative',
        minHeight: LINE_HEIGHT * 6,
        marginTop: 0,
    },
    linesContainer: {
        ...StyleSheet.absoluteFillObject,
        paddingTop: 8,
    },
    lineRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: LINE_HEIGHT,
        width: '100%',
    },
    line: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#CBD5E1',
        opacity: 0.6,
    },
    input: {
        fontSize: 18,
        lineHeight: LINE_HEIGHT,
        color: '#374151', // Slate Gray
        paddingTop: 12 + 4,
        paddingBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
        minHeight: LINE_HEIGHT * 6,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
    },
    suggestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    suggestionText: {
        marginLeft: 6,
        color: '#D97706', // Amber 600
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#D97706', // Amber 600
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    suggestionPopup: {
        position: 'absolute',
        bottom: 70,
        right: 20,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        maxWidth: 200,
        borderWidth: 1,
        borderColor: '#EEE',
        transform: [{ rotate: '-2deg' }],
    },
    popupText: {
        color: '#6B7280',
        fontStyle: 'italic',
        fontSize: 14,
        textAlign: 'center',
    }
});
