import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { ArrowLeft, Check, KeyRound } from 'lucide-react-native';
import {
    ScreenContainer, AppHeader, PrimaryButton, PixelField, PixelCard, PixelAvatar, AvatarPicker,
} from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { useEditProfileController } from '../controllers/useEditProfileController';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

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
                titleStyle={styles.headerTitle}
                leftAction={
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                        hitSlop={8}
                    >
                        <ArrowLeft color={INK} size={20} strokeWidth={2.5} />
                    </Pressable>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
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

                    {!!validationError && (
                        <Text style={styles.validationText}>{validationError}</Text>
                    )}

                    <PrimaryButton
                        label={isSaving ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={!hasChanges || isSaving}
                        icon={!isSaving ? <Check size={18} color="#fff" strokeWidth={3} /> : undefined}
                        style={{ backgroundColor: '#10B981' }}
                    />

                    <View>
                        <Text style={styles.eyebrow}>[ SECURITY ]</Text>
                        <PixelCard padding={0}>
                            <Pressable
                                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                                onPress={handlePasswordReset}
                                disabled={isSendingReset}
                            >
                                <View style={styles.iconBox}>
                                    <KeyRound size={18} color={INDIGO} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.menuLabel}>
                                    {isSendingReset ? 'SENDING...' : 'RESET PASSWORD'}
                                </Text>
                            </Pressable>
                        </PixelCard>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        letterSpacing: 2,
        color: INK,
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    backButtonPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
        gap: 20,
    },
    avatarRow: {
        alignItems: 'center',
    },
    avatarButton: {
        alignItems: 'center',
        gap: 8,
    },
    avatarButtonPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    avatarHint: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INDIGO,
        letterSpacing: 1,
    },
    eyebrow: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 8,
    },
    readOnlyBox: {
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 12,
        // Recessed rather than raised: no hard shadow, and a darker paper, so it
        // doesn't read as a field you can type into.
        backgroundColor: '#EDE9E0',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    readOnlyText: {
        fontSize: 12,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    validationText: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: '#EF4444',
        letterSpacing: 0.5,
        lineHeight: 16,
        marginTop: -8,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    menuRowPressed: {
        backgroundColor: '#EDE9E0',
    },
    iconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7FF',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    menuLabel: {
        flex: 1,
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
        color: INDIGO,
    },
});
