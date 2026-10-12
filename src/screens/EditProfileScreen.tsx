import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, KeyRound } from 'lucide-react-native';
import {
    ScreenContainer, AppHeader, BackButton, MenuRow, PrimaryButton, primaryButtonInk, PixelField, PixelCard, PixelAvatar, AvatarPicker,
} from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { useEditProfileController } from '../controllers/useEditProfileController';
import { DANGER_TEXT } from '../constants/colors';
import { TYPE } from '../constants/typography';
import { HEADING_GAP, SCREEN_BOTTOM, SCREEN_GUTTER, SCREEN_TOP, SECTION_GAP, SPACE } from '../constants/layout';
import { OUTLINE, INK, BORDER_W_INNER, PRESS_SINK } from '../constants/pixel';

const INDIGO = '#4F46E5';

/**
 * Edit the signed-in user's name and avatar, and send them a password reset email.
 *
 * The avatar picks from the preset art in AVATAR_IMAGES; until one is chosen the
 * initial stands in.
 */
export default function EditProfileScreen({ navigation }: any) {
    const {
        email, name, setName, avatarId, setAvatarId, validationError, hasChanges,
        isSaving, saveProfile, isSendingReset, sendPasswordReset,
    } = useEditProfileController();
    const insets = useSafeAreaInsets();

    const [isPickerOpen, setPickerOpen] = useState(false);

    const initial = (name.trim() || email).charAt(0).toUpperCase() || 'U';

    const handleSave = useCallback(async () => {
        try {
            if (await saveProfile()) navigation.goBack();
        } catch {
            PixelAlert.alert('Error', 'Could not save your profile. Please try again.');
        }
    }, [saveProfile, navigation]);

    const handlePasswordReset = useCallback(() => {
        PixelAlert.alert(
            'Reset Password',
            `We'll email a reset link to ${email}.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        try {
                            const sentTo = await sendPasswordReset();
                            PixelAlert.alert('Check Your Inbox', `A reset link is on its way to ${sentTo}.`);
                        } catch (error: any) {
                            PixelAlert.alert("Couldn't send it", error?.message ?? 'Please try again.');
                        }
                    },
                },
            ]
        );
    }, [email, sendPasswordReset]);

    return (
        <ScreenContainer variant="calm">
            <AppHeader
                title="Edit Profile"
                leftAction={<BackButton onPress={() => navigation.goBack()} />}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.avatarRow}>
                        <Pressable
                            onPress={() => setPickerOpen(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Change avatar"
                            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}
                        >
                            <PixelAvatar avatarId={avatarId} initial={initial} size={80} />
                            <Text style={styles.avatarHint}>[ CHANGE ]</Text>
                        </Pressable>
                    </View>

                    <AvatarPicker
                        visible={isPickerOpen}
                        selectedId={avatarId}
                        onSelect={setAvatarId}
                        onClose={() => setPickerOpen(false)}
                    />

                    <PixelField
                        eyebrow="[ NAME ]"
                        value={name}
                        onChangeText={setName}
                        placeholder="What should we call you?"
                        maxLength={30}
                    />

                    <View>
                        <Text style={styles.eyebrow}>[ EMAIL ]</Text>
                        <View style={styles.readOnlyBox}>
                            <Text style={styles.readOnlyText} numberOfLines={1}>{email}</Text>
                        </View>
                    </View>

                    {/* The error sits right above the button it is holding back, the
                        same way the goal form shows it -- no negative margin needed. */}
                    <View style={styles.group}>
                        {!!validationError && (
                            <Text style={styles.validationText}>{validationError}</Text>
                        )}

                        <PrimaryButton
                            label={isSaving ? 'Saving...' : 'Save Changes'}
                            onPress={handleSave}
                            loading={isSaving}
                            disabled={!hasChanges || isSaving}
                            icon={!isSaving ? <Check size={18} color={primaryButtonInk()} strokeWidth={3} /> : undefined}
                        />
                    </View>

                    <View>
                        <Text style={styles.eyebrow}>[ SECURITY ]</Text>
                        <PixelCard padding={0}>
                            <MenuRow
                                icon={KeyRound}
                                label={isSendingReset ? 'SENDING...' : 'RESET PASSWORD'}
                                color={INDIGO}
                                tint="#E0E7FF"
                                onPress={handlePasswordReset}
                                disabled={isSendingReset}
                                showChevron={false}
                                isLast
                            />
                        </PixelCard>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: SCREEN_GUTTER,
        paddingTop: SCREEN_TOP,
        gap: SECTION_GAP,
    },
    group: {
        gap: SPACE.sm,
    },
    avatarRow: {
        alignItems: 'center',
    },
    avatarButton: {
        alignItems: 'center',
        gap: SPACE.sm,
    },
    avatarButtonPressed: {
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
    },
    avatarHint: {
        ...TYPE.label,
        color: INDIGO,
    },
    eyebrow: {
        ...TYPE.h2,
        marginBottom: HEADING_GAP,
    },
    readOnlyBox: {
        minHeight: 40, // Matches PixelField; a floor, so a large font grows it
        justifyContent: 'center',
        paddingHorizontal: SPACE.md,
        // Recessed rather than raised: no hard shadow, and a darker paper, so it
        // doesn't read as a field you can type into.
        backgroundColor: '#EDE9E0',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    readOnlyText: {
        ...TYPE.body,
        // INK, not INK_MUTED: on the recessed paper INK_MUTED was 3.9:1. The darker
        // fill and the missing shadow already say "not editable".
        color: INK,
        letterSpacing: 1,
    },
    validationText: {
        ...TYPE.caption,
        color: DANGER_TEXT,
    },
});
