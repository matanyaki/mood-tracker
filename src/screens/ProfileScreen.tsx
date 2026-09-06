import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput,
    KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LogOut, User, Shield, ChevronRight, CloudOff } from 'lucide-react-native';
import { ScreenContainer, AppHeader, PixelCard, PrimaryButton } from '../components';
import { ProfileScreenSkeleton } from '../components/skeleton';
import { useAuth } from '../context/AuthContext';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

const INDIGO = '#4F46E5';
const DANGER = '#EF4444';

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

export default function ProfileScreen() {
    const { user, isGuest, isLoading, logout, login, signup } = useAuth();

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = useCallback(async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setAuthLoading(true);
        try {
            if (isSignUp) {
                await signup(email, password);
                Alert.alert("Success", "Account created and data synced!");
            } else {
                await login(email, password);
                // login success automatically updates user state via context
            }
            // Clear form
            setEmail('');
            setPassword('');
        } catch (error: any) {
            Alert.alert('Authentication Error', error.message);
        } finally {
            setAuthLoading(false);
        }
    }, [email, password, isSignUp, signup, login]);

    const handleComingSoon = useCallback(() => {
        Alert.alert("Coming Soon", "This feature is under development.");
    }, []);

    const handleLogout = useCallback(async () => {
        Alert.alert(
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
                            Alert.alert("Error", "Failed to log out");
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

                        <Text style={styles.versionText}>V1.0.0 [ GUEST ]</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenContainer>
        );
    }

    // --- RENDER AUTHENTICATED VIEW ---
    return (
        <ScreenContainer variant="calm">
            <AppHeader title="Profile" titleStyle={styles.headerTitle} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* User Card */}
                <PixelCard padding={18} accentColor={INDIGO} wrapperStyle={styles.userCardWrapper}>
                    <View style={styles.userRow}>
                        {/* Square, outlined: the 30px radius this carried was the only
                            circle left anywhere on the screen. */}
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>

                        <View style={styles.userText}>
                            <Text style={styles.userName}>HELLO!</Text>
                            <Text style={styles.userEmail} numberOfLines={1}>
                                {user?.email}
                            </Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>SYNCED</Text>
                            </View>
                        </View>
                    </View>
                </PixelCard>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>[ ACCOUNT ]</Text>
                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRow
                        icon={User}
                        label="EDIT PROFILE"
                        color={INDIGO}
                        tint="#E0E7FF"
                        onPress={handleComingSoon}
                    />
                    <MenuRow
                        icon={Shield}
                        label="PRIVACY & SECURITY"
                        color="#166534"
                        tint="#DCFCE7"
                        onPress={handleComingSoon}
                        isLast
                    />
                </PixelCard>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>[ ACTIONS ]</Text>
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

                <Text style={styles.versionText}>V1.0.0 [ PRO ]</Text>
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
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: '#DCFCE7',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    badgeText: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: '#166534',
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
