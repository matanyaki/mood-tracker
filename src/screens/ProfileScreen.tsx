// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LogOut, User, Shield, ChevronRight } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card } from '../components';
import { useProfileController } from '../controllers/useProfileController';

export default function ProfileScreen() {
    const {
        user,
        handleLogout,
        handleComingSoon,
        // Auth Logic
        email, setEmail,
        password, setPassword,
        isSignUp, loading,
        handleAuth, toggleAuthMode
    } = useProfileController();

    // -- RENDER LOGIN FORM IF NOT AUTHENTICATED --
    if (!user) {
        return (
            <ScreenContainer>
                <AppHeader title="Profile" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.authContainer}
                >
                    <ScrollView contentContainerStyle={styles.authScroll}>
                        <View style={styles.authCard}>
                            <Text style={styles.authTitle}>
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </Text>
                            <Text style={styles.authSubtitle}>
                                {isSignUp
                                    ? 'Sign up to sync your emotional journey.'
                                    : 'Log in to view your history and stats.'}
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

                            {loading ? (
                                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
                            ) : (
                                <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
                                    <Text style={styles.authButtonText}>
                                        {isSignUp ? 'Sign Up' : 'Log In'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.switchButton} onPress={toggleAuthMode}>
                                <Text style={styles.switchText}>
                                    {isSignUp
                                        ? 'Already have an account? Log in'
                                        : "Don't have an account? Sign up"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenContainer>
        );
    }

    // -- RENDER PROFILE IF AUTHENTICATED --
    const MenuRow = ({ icon: Icon, label, color = '#4A4A4A', onPress }: any) => (
        <TouchableOpacity style={styles.menuRow} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon size={20} color={color} />
            </View>
            <Text style={[styles.menuLabel, { color }]}>{label}</Text>
            <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <AppHeader title="Profile" />

            <View style={styles.content}>
                {/* User Card */}
                <Card padding={20} style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>Hello!</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
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

                <Text style={styles.versionText}>Version 1.0.0 (MVP)</Text>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20 },

    // Auth Styles
    authContainer: { flex: 1 },
    authScroll: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: '80%' },
    authCard: { width: '100%', backgroundColor: '#fff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    authTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
    authSubtitle: { fontSize: 16, color: '#4A4A4A', marginBottom: 32, textAlign: 'center' },
    input: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
    authButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    authButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchButton: { marginTop: 24, alignItems: 'center' },
    switchText: { color: '#4F46E5', fontSize: 15, fontWeight: '500' },

    // User Card
    userCard: {
        flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30
    },
    avatar: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center'
    },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#4F46E5' },
    userName: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
    userEmail: { fontSize: 16, color: '#4A4A4A' },

    // Sections
    sectionTitle: {
        fontSize: 20, fontWeight: '700', color: '#1A1A2E',
        marginBottom: 10, marginLeft: 5, textTransform: 'uppercase'
    },
    menuCard: { overflow: 'hidden', marginBottom: 25 },

    // Menu Rows
    menuRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16, backgroundColor: '#fff'
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', marginRight: 15
    },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 67 },

    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12 }
});