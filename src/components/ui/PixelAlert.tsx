import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import PixelCard from './PixelCard';
import SecondaryButton from './SecondaryButton';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SPACE } from '../../constants/layout';
import { OUTLINE, INK, BORDER_W_INNER } from '../../constants/pixel';

export interface PixelAlertButton {
    text: string;
    /**
     * 'cancel' is the button Android's back gesture presses. 'destructive' is accepted
     * so call sites read exactly like Alert.alert, but it draws the same as the rest:
     * the dialog has no accent colour, red included.
     */
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface AlertContent {
    title: string;
    message?: string;
    buttons: PixelAlertButton[];
}

/** Set by the mounted PixelAlertHost. There is one, in App.tsx. */
let showAlert: ((content: AlertContent) => void) | null = null;

/**
 * Drop-in for React Native's Alert.alert, drawn as a pixel-art dialog.
 *
 * The native alert takes its look from the OS -- rounded corners, the system font,
 * tinted buttons -- which made it the one surface in the app that ignored the pixel
 * style. Same signature, so a call site only changes its import. It also works on
 * web, where Alert.alert does nothing at all.
 */
export const PixelAlert = {
    alert(title: string, message?: string, buttons?: PixelAlertButton[]) {
        if (!showAlert) {
            console.warn('[PixelAlert] No PixelAlertHost is mounted.');
            return;
        }
        showAlert({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
    },
};

/**
 * Draws whatever PixelAlert.alert was last asked to show. Mount once, at the root.
 *
 * iOS presents a Modal from the nearest view controller, so a dialog raised while a
 * different Modal is still open would not appear over it. No call site does that:
 * the gratitude note closes itself before its save can fail.
 */
export function PixelAlertHost() {
    const [content, setContent] = useState<AlertContent | null>(null);
    // Separate from `content` so the text stays on the dialog while it fades out.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        showAlert = next => {
            setContent(next);
            setVisible(true);
        };
        return () => { showAlert = null; };
    }, []);

    // Closed first, then the handler runs: a handler that raises its own alert (a
    // failed log out, say) replaces this one instead of being closed by it.
    const press = (button?: PixelAlertButton) => {
        setVisible(false);
        button?.onPress?.();
    };

    const buttons = content?.buttons ?? [];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            // Android back: the cancel button if there is one, otherwise just close.
            onRequestClose={() => press(buttons.find(button => button.style === 'cancel'))}
        >
            <View style={styles.overlay}>
                <PixelCard padding={CARD_PADDING} wrapperStyle={styles.dialog}>
                    <View style={styles.header} accessibilityRole="alert">
                        <Text style={styles.title}>{content?.title.toUpperCase()}</Text>
                    </View>

                    {!!content?.message && <Text style={styles.message}>{content.message}</Text>}

                    <View style={styles.buttons}>
                        {buttons.map((button, index) => (
                            <SecondaryButton
                                key={index}
                                label={button.text.toUpperCase()}
                                onPress={() => press(button)}
                                style={styles.button}
                            />
                        ))}
                    </View>
                </PixelCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACE.xl,
        // The same flat dim as the PixelSelect panel's backdrop.
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    dialog: {
        width: '100%',
        maxWidth: 340,
    },
    // Title and divider match the Insights card headers.
    header: {
        paddingBottom: SPACE.md,
        marginBottom: SPACE.md,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    title: {
        ...TYPE.h3,
    },
    message: {
        ...TYPE.body,
        color: INK,
        marginBottom: SPACE.lg,
    },
    buttons: {
        flexDirection: 'row',
        gap: SPACE.sm,
    },
    button: {
        flex: 1,
    },
});
