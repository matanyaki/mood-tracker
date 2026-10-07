import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import PixelCard from './PixelCard';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

/** How long the delete button has to be held down. */
const HOLD_MS = 5000;
const HOLD_SECONDS = HOLD_MS / 1000;

/** Fill the button turns as it is held. Paper-white text on it is 4.75:1. */
const DANGER_FILL = '#DC2626';
/** Label on the unfilled button. 6.4:1 on paper. */
const DANGER_INK = '#B91C1C';

type Phase = 'idle' | 'holding' | 'working' | 'done';

interface HoldToConfirmDialogProps {
    visible: boolean;
    title: string;
    /** What the action does, in plain words. Shown above the buttons. */
    message: string;
    /** The verb on the button: "delete" reads as HOLD TO DELETE. */
    confirmLabel: string;
    /**
     * Shown in place of the buttons once onConfirm resolves, with a DONE button
     * that closes. Leave it out when the caller closes the dialog itself.
     */
    doneMessage?: string;
    /** Runs once the hold completes. A throw is shown in the dialog, which stays open to retry. */
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

/**
 * A confirmation for things that cannot be undone: the destructive button only
 * fires after being held down for five seconds, filling red as it goes.
 *
 * A tap is too easy to give by accident, and a second "are you sure?" alert gets
 * tapped through on reflex. Holding is a different motion from tapping, and five
 * seconds of watching the bar fill is time to read what is about to happen.
 * Letting go early rewinds the bar, and nothing has happened.
 *
 * Its own Modal rather than a PixelAlert: the alert has one look for every
 * button, and this one needs a button that changes as it is held.
 */
export default function HoldToConfirmDialog({
    visible,
    title,
    message,
    confirmLabel,
    doneMessage,
    onConfirm,
    onClose,
}: HoldToConfirmDialogProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [error, setError] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
    const [buttonWidth, setButtonWidth] = useState(0);

    const progress = useRef(new Animated.Value(0)).current;
    const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
    // A ref, not `phase`: press-out and the animation's end can land in the same
    // frame, and each would otherwise act on the phase from its own render.
    const holding = useRef(false);

    const stopTicker = () => {
        if (ticker.current) clearInterval(ticker.current);
        ticker.current = null;
    };

    // Every opening starts clean, whatever the last one ended on.
    useEffect(() => {
        if (visible) {
            setPhase('idle');
            setError(null);
            setSecondsLeft(HOLD_SECONDS);
            progress.setValue(0);
        }
        return () => {
            holding.current = false;
            stopTicker();
            progress.stopAnimation();
        };
    }, [visible, progress]);

    const busy = phase === 'working';

    const confirm = async () => {
        holding.current = false;
        stopTicker();
        progress.setValue(1);
        setPhase('working');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        try {
            await onConfirm();
            setPhase('done');
        } catch (e: any) {
            setError(e?.message ?? 'Something went wrong. Please try again.');
            setPhase('idle');
            setSecondsLeft(HOLD_SECONDS);
            progress.setValue(0);
        }
    };

    const startHold = () => {
        if (phase !== 'idle') return;
        holding.current = true;
        setError(null);
        setPhase('holding');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const startedAt = Date.now();
        setSecondsLeft(HOLD_SECONDS);
        ticker.current = setInterval(() => {
            const left = Math.ceil((HOLD_MS - (Date.now() - startedAt)) / 1000);
            setSecondsLeft(Math.max(1, left));
        }, 100);

        progress.setValue(0);
        // Linear: the bar is a clock, and an eased one would misreport the time left.
        // Not on the native driver -- it animates width, which the clipped label
        // inside the fill needs and a scaleX would squash.
        Animated.timing(progress, {
            toValue: 1,
            duration: HOLD_MS,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished && holding.current) confirm();
        });
    };

    const releaseHold = () => {
        if (!holding.current) return;
        holding.current = false;
        stopTicker();
        progress.stopAnimation();
        Animated.timing(progress, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
        setPhase('idle');
        setSecondsLeft(HOLD_SECONDS);
    };

    const label =
        phase === 'holding' ? `KEEP HOLDING... ${secondsLeft}`
            : phase === 'working' || phase === 'done' ? 'DELETING...'
                : `HOLD TO ${confirmLabel.toUpperCase()}`;

    const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            // Android back closes it, except mid-delete: the request is already out.
            onRequestClose={() => { if (!busy) onClose(); }}
        >
            <View style={styles.overlay}>
                <PixelCard padding={18} wrapperStyle={styles.dialog}>
                    <View style={styles.header} accessibilityRole="alert">
                        <Text style={styles.title}>{title.toUpperCase()}</Text>
                    </View>

                    {phase === 'done' && doneMessage ? (
                        <>
                            <Text style={styles.message}>{doneMessage}</Text>
                            <Pressable
                                onPress={onClose}
                                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.buttonText}>DONE</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Text style={styles.message}>{message}</Text>
                            <Text style={styles.hint}>
                                Press and hold the button for {HOLD_SECONDS} seconds to confirm.
                            </Text>

                            {!!error && <Text style={styles.error}>{error}</Text>}

                            <Pressable
                                onPressIn={startHold}
                                onPressOut={releaseHold}
                                disabled={busy || phase === 'done'}
                                onLayout={e => setButtonWidth(e.nativeEvent.layout.width)}
                                style={styles.holdButton}
                                accessibilityRole="button"
                                accessibilityLabel={`Hold to ${confirmLabel}`}
                                accessibilityHint={`Press and hold for ${HOLD_SECONDS} seconds. This cannot be undone.`}
                                accessibilityState={{ busy, disabled: busy }}
                                // Screen readers: double-tap-and-hold arrives as this
                                // action rather than as a held touch.
                                accessibilityActions={[{ name: 'longpress' }]}
                                onAccessibilityAction={e => {
                                    if (e.nativeEvent.actionName === 'longpress' && phase === 'idle') confirm();
                                }}
                            >
                                <Text style={styles.holdText}>{label}</Text>

                                {/* The red fill carries its own white copy of the label,
                                    laid out at the button's full width and clipped by
                                    the fill, so each half of the text stays readable
                                    on whichever colour it is over. */}
                                <Animated.View
                                    style={[styles.holdFill, { width: fillWidth }]}
                                    pointerEvents="none"
                                >
                                    <View style={[styles.holdFillInner, { width: buttonWidth - BORDER_W_INNER * 2 }]}>
                                        {busy
                                            ? <ActivityIndicator color={PAPER} size="small" />
                                            : <Text style={[styles.holdText, styles.holdTextOnFill]}>{label}</Text>}
                                    </View>
                                </Animated.View>
                            </Pressable>

                            <Pressable
                                onPress={onClose}
                                disabled={busy}
                                style={({ pressed }) => [
                                    styles.button,
                                    styles.cancelButton,
                                    pressed && styles.buttonPressed,
                                    busy && styles.buttonDisabled,
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ disabled: busy }}
                            >
                                <Text style={styles.buttonText}>CANCEL</Text>
                            </Pressable>
                        </>
                    )}
                </PixelCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // Overlay, dialog, header, title and message match PixelAlert.
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    dialog: {
        width: '100%',
        maxWidth: 340,
    },
    header: {
        paddingBottom: 12,
        marginBottom: 14,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    title: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    message: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK,
        lineHeight: 20,
        marginBottom: 12,
    },
    hint: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 16,
        marginBottom: 16,
    },
    error: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: DANGER_INK,
        lineHeight: 16,
        marginBottom: 12,
    },
    holdButton: {
        // Full width, stacked over CANCEL: a long hold wants a big target, and the
        // countdown label would not fit half a dialog.
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: DANGER_INK,
        overflow: 'hidden',
    },
    holdFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: DANGER_FILL,
        overflow: 'hidden',
    },
    holdFillInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    holdText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: DANGER_INK,
        letterSpacing: 1,
    },
    holdTextOnFill: {
        color: PAPER,
    },
    button: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    cancelButton: {
        marginTop: 10,
    },
    buttonPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
});
