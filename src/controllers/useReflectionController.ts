import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalService } from '../services/journalService';
import { useAuth } from '../context/AuthContext';

export const useReflectionController = (route: any, navigation: any) => {
    const { user, isGuest } = useAuth();
    const { selections } = route.params;
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleTextChange = useCallback((id: string, text: string) => {
        setNotes(prev => ({ ...prev, [id]: text }));
    }, []);

    const handleSave = useCallback(async () => {
        if (loading) return; // Prevent double taps
        setLoading(true);

        try {
            // Resolve the acting userId the same way the greeting flow does:
            // guests get GUEST_ID, which JournalService branches on internally.
            const userId = isGuest || !user ? JournalService.GUEST_ID : user.uid;

            if (!user && !isGuest) {
                Alert.alert("Not signed in", "Please sign in or continue as a guest to save your entry.");
                return;
            }

            // 1. Prepare Data
            // Collect ALL emotions into an array
            const emotionEntries = selections.map((sel: any) => ({
                id: sel.id,
                label: sel.label,
                scale: sel.scale,
                note: notes[sel.id] || ""
            }));

            const entryData = {
                userId,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),

                // NEW SCHEMA COMPLETE
                emotions: emotionEntries
            };

            // 2. Save to Firebase/Local (via JournalService)
            console.log("[Reflection] Saving entry for User UID:", userId);
            console.log("[Reflection] Data payload:", JSON.stringify(entryData));

            // @ts-ignore
            const entryId = await JournalService.addEntry(entryData);
            console.log("[Reflection] Entry saved successfully. ID:", entryId);

            // Invalidate the cached month so the just-saved entry appears on Insights immediately
            const monthKey = `@journal_month_${entryData.date.slice(0, 7)}`;
            await AsyncStorage.removeItem(monthKey);

            // 3. Navigate Home immediately (AI Removed as requested)
            navigation.reset({
                index: 0,
                routes: [{ name: 'App' }],
            });

        } catch (error) {
            console.error("[Reflection] Save Error:", error);
            Alert.alert("Error", "Could not save entry. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [selections, notes, loading, navigation, user, isGuest]);

    return {
        selections,
        notes,
        loading,
        handleTextChange,
        handleSave
    };
};