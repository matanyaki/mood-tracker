// src/controllers/useReflectionController.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { JournalService } from '../services/journalService';
import { AIService } from '../services/aiService';
import { doc, updateDoc } from 'firebase/firestore';

export const useReflectionController = (route: any, navigation: any) => {
    const { selections } = route.params;
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // AI Modal State
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    const handleTextChange = (id: string, text: string) => {
        setNotes(prev => ({ ...prev, [id]: text }));
    };

    const handleSave = async () => {
        if (loading) return; // Prevent double taps
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) return;

            // 1. Prepare Data
            // Collect ALL emotions into an array
            const emotionEntries = selections.map((sel: any) => ({
                id: sel.id,
                label: sel.label,
                scale: sel.scale,
                note: notes[sel.id] || ""
            }));

            // Identification of "Primary" emotion (e.g. highest intensity) for quick reference
            const primarySelection = selections.reduce((prev: any, current: any) =>
                (prev.scale > current.scale) ? prev : current
                , selections[0]);

            if (!primarySelection) return;

            const entryData = {
                userId: user.uid,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),

                // NEW SCHEMA COMPLETE
                emotions: emotionEntries,
                aiFeedback: ""
            };

            // 2. Save to Firebase/Local (via JournalService)
            console.log("[Reflection] Saving entry for User UID:", user.uid);
            console.log("[Reflection] Data payload:", JSON.stringify(entryData));

            // @ts-ignore
            const entryId = await JournalService.addEntry(entryData);
            console.log("[Reflection] Entry saved successfully. ID:", entryId);

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
    };

    // Removed AI Modal handlers since logic is stripped
    const closeAiModal = () => { };

    return {
        selections,
        notes,
        loading,
        handleTextChange,
        handleSave,
        aiFeedback: null,
        showAiModal: false,
        closeAiModal
    };
};