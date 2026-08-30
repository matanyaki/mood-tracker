import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LogOut, User, Shield, ChevronRight, CloudOff } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card } from '../components';
import { ProfileScreenSkeleton, SkeletonBox } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';

const MenuRow = ({ icon: Icon, label, color = '#4A4A4A', onPress }: any) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
            <Icon size={20} color={color} />
        </View>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
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
            <ScreenContainer>
                <AppHeader title="Profile" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>

                        {/* Guest Banner */}
                        <Card padding={16} style={[styles.guestCard, { marginBottom: 20 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <CloudOff size={24} color="#EA580C" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: '700', color: '#9A3412', fontSize: 16 }}>Guest Mode</Text>
                                    <Text style={{ fontSize: 14, color: '#9A3412', marginTop: 4 }}>
                                        Check-ins are saved locally. Sign up to backup your history to the cloud.
                                    </Text>
                                </View>
                            </View>
                        </Card>

                        {/* Auth Form */}
                        <Card padding={24} style={styles.authCard}>
                            <Text style={styles.authTitle}>
                                {isSignUp ? 'Create Account' : 'Log In'}
                            </Text>
                            <Text style={styles.authSubtitle}>
                                {isSignUp
                                    ? 'Sync your local data to the cloud.'
                                    : 'Access your history across devices.'}
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#9CA3AF"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#9CA3AF"
                            />

                            {authLoading ? (
                                <SkeletonBox height={56} borderRadius={12} style={{ marginTop: 8 }} />
                            ) : (
                                <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
                                    <Text style={styles.authButtonText}>
                                        {isSignUp ? 'Sign Up & Sync' : 'Log In'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => setIsSignUp(!isSignUp)}
                            >
                                <Text style={styles.switchText}>
                                    {isSignUp
                                        ? 'Already have an account? Log in'
                                        : "Don't have an account? Sign up"}
                                </Text>
                            </TouchableOpacity>
                        </Card>

                        <Text style={styles.versionText}>Version 1.0.0 (Guest)</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenContainer>
        );
    }

    // --- RENDER AUTHENTICATED VIEW ---
    return (
        <ScreenContainer>
            <AppHeader title="Profile" />

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Card */}
                <Card padding={20} style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>Hello!</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Synced</Text>
                        </View>
                    </View>
                </Card>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card padding={0} style={styles.menuCard}>
                    <MenuRow
                        icon={User}
                        label="Edit Profile"
                        onPress={handleComingSoon}
                    />
                    <View style={styles.divider} />
                    <MenuRow
                        icon={Shield}
                        label="Privacy & Security"
                        onPress={handleComingSoon}
                    />
                </Card>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>Actions</Text>
                <Card padding={0} style={styles.menuCard}>
                    <MenuRow
                        icon={LogOut}
                        label="Log Out"
                        color="#EF4444"
                        onPress={handleLogout}
                    />
                </Card>

                <Text style={styles.versionText}>Version 1.0.0 (Pro)</Text>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20 },
    scrollContent: { padding: 20 },

    // Guest / Auth Styles
    guestCard: { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5', borderWidth: 1 },
    authCard: { width: '100%', marginBottom: 20 },
    authTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
    authSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
    input: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
    authButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    authButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchButton: { marginTop: 20, alignItems: 'center' },
    switchText: { color: '#4F46E5', fontSize: 14, fontWeight: '500' },

    // User Card
    userCard: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#4F46E5' },
    userName: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
    userEmail: { fontSize: 14, color: '#4A4A4A', marginBottom: 4 },
    badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
    badgeText: { color: '#166534', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    // Shared
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuCard: { overflow: 'hidden', marginBottom: 25 },
    menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
    iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 67 },
    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 10 }
});