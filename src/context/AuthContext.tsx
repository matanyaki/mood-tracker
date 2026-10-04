import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { GUEST_STORAGE_KEY, GUEST_GREETINGS_KEY, GUEST_GOALS_KEY, GUEST_GOAL_COMPLETIONS_KEY } from '../constants/variables';
import { UserService } from '../services/userService';
import { JournalService } from '../services/journalService';
import { GreetingService } from '../services/greetingService';
import { GoalService, Goal } from '../services/goalService';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// The migration in flight, if any. onAuthStateChanged can fire again before it
// finishes, and a second run would read the same guest data and upload it twice.
let migrating: Promise<void> | null = null;

/**
 * Uploads the device's guest entries, greetings, goals and goal completions to
 * `user`'s account. Each item is dropped from guest storage as soon as it
 * uploads, so if one fails, the next run starts from the first item that
 * didn't make it. Resolves true if anything was uploaded.
 *
 * Stops, leaving the rest in guest storage, as soon as `user` is no longer the
 * signed-in account: the services send whichever token is current, so an
 * upload after a switch would land in the other account.
 */
async function migrateGuestData(user: User): Promise<boolean> {
    let migratedAny = false;
    const stillSignedIn = () => auth.currentUser?.uid === user.uid;
    try {
        const { entries, greetings } = await UserService.migrateGuestData(user);

        if (entries.length > 0) {
            console.log(`[AuthContext] Found ${entries.length} un-synced guest entries. Migrating now...`);
            for (let i = 0; i < entries.length; i++) {
                if (!stillSignedIn()) return migratedAny;
                const { id, ...entryData } = entries[i];
                await JournalService.addEntry({
                    ...entryData,
                    userId: user.uid,
                });
                migratedAny = true;
                await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(entries.slice(i + 1)));
            }
        }

        if (greetings.length > 0) {
            console.log(`[AuthContext] Found ${greetings.length} un-synced guest greetings. Migrating now...`);
            for (let i = 0; i < greetings.length; i++) {
                if (!stillSignedIn()) return migratedAny;
                await GreetingService.addGreeting(user.uid, greetings[i].text);
                migratedAny = true;
                await AsyncStorage.setItem(GUEST_GREETINGS_KEY, JSON.stringify(greetings.slice(i + 1)));
            }
        }

        // Goals. Completions are stored as goalId -> dates, keyed by the goal's
        // local id. Once a goal exists on the server, its dates move to the new
        // id in the same write that drops the goal, so a key that matches no
        // guest goal is a server id whose dates didn't all make it last time.
        const goalsJson = await AsyncStorage.getItem(GUEST_GOALS_KEY);
        const completionsJson = await AsyncStorage.getItem(GUEST_GOAL_COMPLETIONS_KEY);
        const goals: Goal[] = goalsJson ? JSON.parse(goalsJson) : [];
        const completions: Record<string, string[]> = completionsJson ? JSON.parse(completionsJson) : {};

        // Posts one server goal's stored dates, dropping each once it's up.
        const postCompletions = async (goalId: string) => {
            const dates = completions[goalId] ?? [];
            while (dates.length > 0) {
                if (!stillSignedIn()) return;
                await GoalService.markGoalDone(user.uid, goalId, dates[0]);
                migratedAny = true;
                dates.shift();
                if (dates.length === 0) delete completions[goalId];
                await AsyncStorage.setItem(GUEST_GOAL_COMPLETIONS_KEY, JSON.stringify(completions));
            }
        };

        for (const goalId of Object.keys(completions)) {
            if (!goals.some(goal => goal.id === goalId)) await postCompletions(goalId);
        }

        if (goals.length > 0) {
            console.log(`[AuthContext] Found ${goals.length} un-synced guest goals. Migrating now...`);
            for (let i = 0; i < goals.length; i++) {
                if (!stillSignedIn()) return migratedAny;
                const { id, userId, endDate, pauses, createdAt, updatedAt, ...goalData } = goals[i];
                const created = await GoalService.createGoal(user.uid, goalData);
                if (!created.id) throw new Error("Created goal has no id.");
                migratedAny = true;

                // Create never carries pauses, so the guest's are replayed in order on
                // the new id -- otherwise paused days would come back as missed ones.
                for (const pause of pauses ?? []) {
                    await GoalService.pauseGoal(user.uid, created.id, pause.lastDay);
                    if (pause.resumedOn) await GoalService.resumeGoal(user.uid, created.id, pause.resumedOn);
                }

                if (id && completions[id]) {
                    completions[created.id] = completions[id];
                    delete completions[id];
                }
                await AsyncStorage.multiSet([
                    [GUEST_GOALS_KEY, JSON.stringify(goals.slice(i + 1))],
                    [GUEST_GOAL_COMPLETIONS_KEY, JSON.stringify(completions)],
                ]);

                await postCompletions(created.id);
            }
        }

        if (migratedAny && stillSignedIn()) {
            // Everything made it: drop the now-empty keys.
            await UserService.clearGuestData();
            await AsyncStorage.multiRemove([GUEST_GOALS_KEY, GUEST_GOAL_COMPLETIONS_KEY]);
            console.log("[AuthContext] Guest migration complete.");
        }
    } catch (e) {
        console.error("[AuthContext] Auto-migration error:", e);
    }
    return migratedAny;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // Only a placeholder while isLoading is true: the listener's first call sets it
    // from whether Firebase restored a user.
    const [isGuest, setIsGuest] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();
    // The uid the query cache belongs to (null = guest). undefined until the
    // listener's first call, which only records it: the persisted cache was
    // written by whoever was signed in last, and Firebase restores that same user.
    const cacheUid = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        console.log("[AuthContext] Mounting...");
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("[AuthContext] Auth State Changed:", currentUser ? currentUser.email : "No User");

            if (!isMounted) return;

            // A different account (guest -> user, or A -> B): query keys carry no
            // uid, so wipe the cache before the state change lets any screen read it.
            // reset, not clear: clear() never tells a mounted screen its query is
            // gone, so an open tab would keep drawing the last account's data.
            const uid = currentUser?.uid ?? null;
            if (cacheUid.current !== undefined && cacheUid.current !== uid) {
                queryClient.resetQueries();
            }
            cacheUid.current = uid;

            // Resolve auth state first: the spinner never waits on the network.
            // No user means guest mode.
            setUser(currentUser);
            setIsGuest(!currentUser);
            setIsLoading(false);
            console.log("[AuthContext] Loading set to false");

            if (currentUser) {
                // Sync user profile in background
                UserService.syncUser(currentUser).catch(err => {
                    console.error("[AuthContext] Profile sync error:", err);
                });

                // Auto-Migrate Guest Data on any login if it exists, in the background.
                // This covers: 1. Signup, 2. Login from guest mode, 3. A migration cut short last time
                if (!migrating) {
                    migrating = migrateGuestData(currentUser)
                        .then(migratedAny => {
                            if (migratedAny) queryClient.invalidateQueries();
                        })
                        .finally(() => { migrating = null; });
                }
            }
        });

        return () => {
            console.log("[AuthContext] Unmounting...");
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string) => {
        console.log("[AuthContext] Logging in...");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signup = async (email: string, pass: string) => {
        console.log("[AuthContext] Signing up...");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await UserService.syncUser(cred.user);
        // Guest data is migrated by the onAuthStateChanged listener, not here.
    };

    const logout = async () => {
        console.log("[AuthContext] User initiated logout");
        await firebaseSignOut(auth);

        // Clear this user's cached data so the next user to log in doesn't see it.
        // Entries and greetings are cached by TanStack Query now, not AsyncStorage, so
        // dropping the query cache is what replaces the old @journal_month_* sweep.
        // Guest device keys (@guest_journal_entries, @guest_greetings) are left intact.
        queryClient.clear();

        setUser(null);
        setIsGuest(true); // Fallback to guest mode
    };

    return (
        <AuthContext.Provider value={{
            user,
            isGuest,
            isLoading,
            login,
            signup,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
