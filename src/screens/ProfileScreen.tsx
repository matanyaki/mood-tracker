import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import {
    LogOut, User, ChevronRight, CloudOff, Lightbulb, CircleHelp, Info,
    FileText, Trash2, UserX,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { ScreenContainer, AppHeader, PixelCard, PrimaryButton } from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { ProfileScreenSkeleton } from '../components/skeleton';
import { useAuth } from '../context/AuthContext';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { getAuthErrorMessage, validateAuthForm } from '../utils/authErrors';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

const INDIGO = '#4F46E5';
const DANGER = '#EF4444';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** "MAR 2026", or null if the stored date is missing or unreadable. */
const formatMemberSince = (createdAt: unknown): string | null => {
    if (typeof createdAt !== 'string') return null;
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? null : format(date, 'MMM yyyy').toUpperCase();
};

/**
 * One row of a settings card.
 *
 * The icon tints are flat opaque swatches rather than the `color + '15'` the row
 * used to build: an eight-digit hex is a translucent fill, and it takes its
 * lightness from whatever happens to be behind it.
 */
const MenuRow = ({ icon: Icon, label, color = INK, tint, onPress, isLast = false }: any) => (
    <Pressable
        style={({ pressed }) => [
            styles.menuRow,
            !isLast && styles.menuRowDivided,
            pressed && styles.menuRowPressed,
        ]}
        onPress={onPress}
    >
        <View style={[styles.iconBox, { backgroundColor: tint }]}>
            <Icon size={18} color={color} strokeWidth={2.5} />
        </View>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <ChevronRight size={16} color={INK_MUTED} strokeWidth={3} />
    </Pressable>
);

/** Tips, Help and About. Shown to guests too: none of them need an account. */
const WellnessSection = ({ onPress }: { onPress: () => void }) => (
    <>
        <Text style={styles.sectionTitle}>[ WELLNESS ]</Text>
        <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
            <MenuRow icon={Lightbulb} label="TIPS" color="#A16207" tint="#FEF9C3" onPress={onPress} />
            <MenuRow icon={CircleHelp} label="HELP" color="#0E7490" tint="#CFFAFE" onPress={onPress} />
            <MenuRow icon={Info} label="ABOUT" color="#7C3AED" tint="#EDE9FE" onPress={onPress} isLast />
        </PixelCard>
    </>
);

export default function ProfileScreen({ navigation }: any) {
    const { user, isGuest, isLoading, logout, login, signup } = useAuth();
    const { data: profile } = useProfileQuery();

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = useCallback(async () => {
        const formError = validateAuthForm(email, password, isSignUp);
        if (formError) {
            PixelAlert.alert(isSignUp ? "Couldn't sign up" : "Couldn't log in", formError);
            return;
        }

        setAuthLoading(true);
        try {
            if (isSignUp) {
                await signup(email.trim(), password);
                PixelAlert.alert("Success", "Account created!");
            } else {
                await login(email.trim(), password);
                // login success automatically updates user state via context
            }
            // Clear form
            setEmail('');
            setPassword('');
        } catch (error: any) {
            console.log('[ProfileScreen] Auth failed:', error?.code, error?.message);
            PixelAlert.alert(isSignUp ? "Couldn't sign up" : "Couldn't log in", getAuthErrorMessage(error));
        } finally {
            setAuthLoading(false);
        }
    }, [email, password, isSignUp, signup, login]);

    const handleComingSoon = useCallback(() => {
        PixelAlert.alert("Coming Soon", "This feature is under development.");
    }, []);

    const handleLogout = useCallback(async () => {
        PixelAlert.alert(
            "Log Out",
            "Are you sure? If you haven't synced your data, it might be lost.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (e) {
                            PixelAlert.alert("Error", "Failed to log out");
                        }
                    }
                }
            ]
        );
    }, [logout]);

    // Auth is still resolving — RootNavigator normally gates this, but the
    // skeleton keeps the screen from flashing empty if that gate ever moves.
    if (isLoading) {
        return <ProfileScreenSkeleton />;
    }

    // --- RENDER GUEST / LOGIN VIEW ---
    if (!user) {
        return (
            <ScreenContainer variant="calm">
                {/* AppHeader is shared with four other screens, so the pixel
                    treatment is passed in here rather than baked into it. */}
                <AppHeader title="Profile" titleStyle={styles.headerTitle} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Guest Banner */}
                        <PixelCard
                            padding={16}
                            accentColor="#EA580C"
                            style={styles.guestCard}
                            wrapperStyle={styles.guestCardWrapper}
                        >
                            <View style={styles.guestRow}>
                                <View style={styles.guestIconBox}>
                                    <CloudOff size={18} color="#EA580C" strokeWidth={2.5} />
                                </View>
                                <View style={styles.guestText}>
                                    <Text style={styles.guestTitle}>GUEST MODE</Text>
                                    <Text style={styles.guestBody}>
                                        Check-ins are saved on this device only. Sign up to back
                                        your history up to the cloud.
                                    </Text>
                                </View>
                            </View>
                        </PixelCard>

                        {/* Auth Form */}
                        <PixelCard padding={20} wrapperStyle={styles.authCardWrapper}>
                            <View style={styles.authHeader}>
                                <Text style={styles.authTitle}>
                                    {isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}
                                </Text>
                                <Text style={styles.authSubtitle}>
                                    {isSignUp
                                        ? 'Sync your local data to the cloud.'
                                        : 'Access your history across devices.'}
                                </Text>
                            </View>

                            <Text style={styles.fieldLabel}>[ EMAIL ]</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                placeholderTextColor="#A8B0BD"
                                underlineColorAndroid="transparent"
                            />

                            <Text style={styles.fieldLabel}>[ PASSWORD ]</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#A8B0BD"
                                underlineColorAndroid="transparent"
                            />

                            <View style={styles.authButtonRow}>
                                <PrimaryButton
                                    label={
                                        authLoading
                                            ? 'Working...'
                                            : isSignUp ? 'Sign Up & Sync' : 'Log In'
                                    }
                                    onPress={handleAuth}
                                    loading={authLoading}
                                    disabled={authLoading}
                                    // Navy face; the button draws its own hard shadow.
                                    style={{ backgroundColor: INK }}
                                />
                            </View>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.switchButton,
                                    pressed && styles.switchButtonPressed,
                                ]}
                                onPress={() => setIsSignUp(!isSignUp)}
                            >
                                <Text style={styles.switchText}>
                                    {isSignUp
                                        ? '[ ALREADY REGISTERED? LOG IN ]'
                                        : '[ NO ACCOUNT? SIGN UP ]'}
                                </Text>
                            </Pressable>
                        </PixelCard>

                        <WellnessSection onPress={handleComingSoon} />

                        <Text style={styles.sectionTitle}>[ THIS DEVICE ]</Text>
                        <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                            <MenuRow
                                icon={Trash2}
                                label="CLEAR DEVICE DATA"
                                color={DANGER}
                                tint="#FEE2E2"
                                onPress={handleComingSoon}
                                isLast
                            />
                        </PixelCard>

                        <Text style={styles.versionText}>V{APP_VERSION} [ GUEST ]</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenContainer>
        );
    }

    // --- RENDER AUTHENTICATED VIEW ---
    const initial = (profile?.displayName || user.email || 'U').charAt(0).toUpperCase();
    const memberSince = formatMemberSince(profile?.createdAt);

    return (
        <ScreenContainer variant="calm">
            <AppHeader title="Profile" titleStyle={styles.headerTitle} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* User Card -- the whole card opens Edit Profile, the way a
                    settings screen's account row does. */}
                <Pressable
                    onPress={() => navigation.navigate('EditProfile')}
                    style={({ pressed }) => pressed && styles.userCardPressed}
                >
                    <PixelCard padding={18} accentColor={INDIGO} wrapperStyle={styles.userCardWrapper}>
                        <View style={styles.userRow}>
                            {/* Square, outlined: the 30px radius this carried was the only
                                circle left anywhere on the screen. */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>

                            <View style={styles.userText}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {profile?.displayName?.toUpperCase() || 'HELLO!'}
                                </Text>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {user?.email}
                                </Text>
                                {!!memberSince && (
                                    <Text style={styles.metaText}>SINCE {memberSince}</Text>
                                )}
                            </View>

                            <ChevronRight size={16} color={INK_MUTED} strokeWidth={3} />
                        </View>
                    </PixelCard>
                </Pressable>

                <Text style={styles.sectionTitle}>[ ACCOUNT ]</Text>
                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRow
                        icon={User}
                        label="EDIT PROFILE"
                        color={INDIGO}
                        tint="#E0E7FF"
                        onPress={() => navigation.navigate('EditProfile')}
                        isLast
                    />
                </PixelCard>

                <WellnessSection onPress={handleComingSoon} />

                <Text style={styles.sectionTitle}>[ PRIVACY ]</Text>
                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRow
                        icon={FileText}
                        label="PRIVACY POLICY"
                        color="#166534"
                        tint="#DCFCE7"
                        onPress={handleComingSoon}
                    />
                    <MenuRow
                        icon={Trash2}
                        label="DELETE ALL MY DATA"
                        color={DANGER}
                        tint="#FEE2E2"
                        onPress={handleComingSoon}
                    />
                    <MenuRow
                        icon={UserX}
                        label="DELETE ACCOUNT"
                        color={DANGER}
                        tint="#FEE2E2"
                        onPress={handleComingSoon}
                        isLast
                    />
                </PixelCard>

                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRow
                        icon={LogOut}
                        label="LOG OUT"
                        color={DANGER}
                        tint="#FEE2E2"
                        onPress={handleLogout}
                        isLast
                    />
                </PixelCard>

                <Text style={styles.versionText}>V{APP_VERSION}</Text>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        letterSpacing: 2,
        color: INK,
    },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },

    // --- Guest banner ---
    guestCardWrapper: {
        marginBottom: 20,
    },
    guestCard: {
        // Warm paper, so the banner reads as a notice without needing a second
        // outline weight to separate it from the cards below.
        backgroundColor: '#FFF7ED',
    },
    guestRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    guestIconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEDD5',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    guestText: {
        flex: 1,
    },
    guestTitle: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: '#9A3412',
        letterSpacing: 2,
        marginBottom: 6,
    },
    guestBody: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: '#9A3412',
        lineHeight: 18,
    },

    // --- Auth form ---
    authCardWrapper: {
        marginBottom: 20,
    },
    authHeader: {
        alignItems: 'center',
        paddingBottom: 14,
        marginBottom: 18,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    authTitle: {
        // Silkscreen runs ~0.76em per character bold: "CREATE ACCOUNT" is 14 of
        // them, which is 255px at the 24 this used to be, against ~260 of room.
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
        marginBottom: 8,
    },
    authSubtitle: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    fieldLabel: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        fontSize: 13,
        fontFamily: PIXEL,
        color: INK,
        includeFontPadding: false, // Android: keep the text off the top border
    },
    authButtonRow: {
        marginTop: 4,
    },
    switchButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 4,
    },
    switchButtonPressed: {
        // Sinks toward its own corner, the way every pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    switchText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INDIGO,
        letterSpacing: 1,
    },

    // --- User card ---
    userCardWrapper: {
        marginBottom: 24,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatar: {
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7FF',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    avatarText: {
        fontSize: 24,
        fontFamily: PIXEL_BOLD,
        color: INDIGO,
    },
    userText: {
        // Without this the column sizes to its text, and a long address widens the
        // row until the card can no longer hold it.
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    userEmail: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        marginTop: 6,
        marginBottom: 8,
    },
    userCardPressed: {
        // Sinks toward its own corner, the way every pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    metaText: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },

    // --- Menu cards ---
    sectionTitle: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 10,
    },
    menuCardWrapper: {
        marginBottom: 24,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    menuRowDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    menuRowPressed: {
        backgroundColor: '#EDE9E0',
    },
    iconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    menuLabel: {
        flex: 1,
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },

    versionText: {
        textAlign: 'center',
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
        marginTop: 4,
    },
});
