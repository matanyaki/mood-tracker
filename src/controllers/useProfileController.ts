import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useProfileController = () => {
    const [user, setUser] = useState<User | null>(auth.currentUser);

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return unsubscribe;
    }, []);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Clear form on success
            setEmail('');
            setPassword('');
        } catch (error: any) {
            Alert.alert('Authentication Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => setIsSignUp(prev => !prev);

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
                            Alert.alert("Error", "Failed to log out");
                        }
                    }
                }
            ]
        );
    };

    const handleComingSoon = () => {
        Alert.alert("Coming Soon", "This feature is next on the list!");
    };

    return {
        user,
        // Auth State & Handlers
        email, setEmail,
        password, setPassword,
        isSignUp,
        loading,
        handleAuth,
        toggleAuthMode,
        // Existing Handlers
        handleLogout,
        handleComingSoon
    };
};
