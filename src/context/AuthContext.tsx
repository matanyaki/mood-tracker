import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { UserService } from '../services/userService';
import { JournalService } from '../services/journalService';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(true); // Default to Guest true initially until proven otherwise (or loading finishes)
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("[AuthContext] Mounting...");
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("[AuthContext] Auth State Changed:", currentUser ? currentUser.email : "No User");

            if (!isMounted) return;

            if (currentUser) {
                // User is logged in
                setUser(currentUser);
                setIsGuest(false);

                // Sync user profile in background
                UserService.syncUser(currentUser).catch(err => {
                    console.error("[AuthContext] Profile sync error:", err);
                });

                // Auto-Migrate Guest Data on any login if it exists
                // This covers: 1. Signup crash recovery, 2. Login from guest mode
                try {
                    const guestEntries = await UserService.migrateGuestData(currentUser);
                    if (guestEntries && guestEntries.length > 0) {
                        console.log(`[AuthContext] Found ${guestEntries.length} un-synced guest entries. Migrating now...`);
                        for (const entry of guestEntries) {
                            const { id, ...entryData } = entry;
                            await JournalService.addEntry({
                                ...entryData,
                                userId: currentUser.uid,
                            });
                        }
                        await UserService.clearGuestData();
                        console.log("[AuthContext] Recovery migration complete.");
                    }
                } catch (e) {
                    console.error("[AuthContext] Auto-migration error:", e);
                }

            } else {
                // User is NOT logged in
                setUser(null);
                // We default to Guest mode for unauthenticated users
                setIsGuest(true);
            }

            setIsLoading(false);
            console.log("[AuthContext] Loading set to false");
        });

        // Safety timeout in case Firebase hangs (rare but possible with network issues)
        const timeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn("[AuthContext] Auth check timed out, forcing load complete.");
                setIsLoading(false);
            }
        }, 5000);

        return () => {
            console.log("[AuthContext] Unmounting...");
            isMounted = false;
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const login = async (email: string, pass: string) => {
        console.log("[AuthContext] Logging in...");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signup = async (email: string, pass: string) => {
        console.log("[AuthContext] Signing up...");
        // Capture guest status before auth changes
        const wasGuest = isGuest;

        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await UserService.syncUser(cred.user);

        // Auto-migrate guest data if they were in guest mode
        // In our new flow, everyone starts as guest implicitly, so we should always check/migrate "local" data
        // provided it exists.
        if (wasGuest) {
            try {
                // Fetch local data
                const guestEntries = await UserService.migrateGuestData(cred.user);

                if (guestEntries && guestEntries.length > 0) {
                    console.log(`[AuthContext] Migrating ${guestEntries.length} guest entries...`);

                    // Upload each entry to the backend with the new User ID
                    for (const entry of guestEntries) {
                        const { id, ...entryData } = entry;
                        // We use JournalService.addEntry which handles the API call
                        // Ensure we pass the new userId explicitly
                        await JournalService.addEntry({
                            ...entryData,
                            userId: cred.user.uid,
                        });
                    }

                    // Clear local guest data
                    await UserService.clearGuestData();
                    console.log("[AuthContext] Migration complete.");
                }
            } catch (e) {
                console.error("[AuthContext] Migration warning:", e);
            }
        }
    };

    const logout = async () => {
        console.log("[AuthContext] User initiated logout");
        await firebaseSignOut(auth);
        setUser(null);
        setIsGuest(true); // Fallback to guest mode
    };

    const continueAsGuest = async () => {
        // This function might be redundant now since we default to guest, 
        // but kept for compatibility.
        setIsGuest(true);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isGuest,
            isLoading,
            login,
            signup,
            logout,
            continueAsGuest
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
