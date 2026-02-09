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
            // Simplified logic: We now only have one selection that matters (or the primary one)
            // But since the UI allows multiple scales, we need to decide.
            // USER REQUESTED: "user will put an emotion :string, scale: number" 
            // This implies a SINGLE emotion entry per "Check In".

            // However, the UI (CheckInScreen) allows multiple sliders.
            // To fit the new schema, we should probably pick the DOMINANT one (highest scale).

            const primarySelection = selections.reduce((prev: any, current: any) =>
                (prev.scale > current.scale) ? prev : current
                , selections[0]);

            if (!primarySelection) return;

            const entryData = {
                userId: user.uid,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),

                // NEW SCHEMA MAPPING
                emotion: primarySelection.label, // "Happy"
                scale: primarySelection.scale,   // 5
                note: notes[primarySelection.id] || "",

                aiFeedback: ""
            };

            // 2. Save to Firebase
            // @ts-ignore
            const entryId = await JournalService.addEntry(entryData);

            // 3. Generate AI Feedback
            try {
                // Pass simplified context
                const aiContext = {
                    ...entryData
                };

                const feedback = await AIService.generateInstantFeedback(aiContext);

                // Update Firebase with the result
                if (entryId && feedback) {
                    const entryRef = doc(db, 'entries', entryId);
                    await updateDoc(entryRef, { aiFeedback: feedback });
                }

                // Show Modal
                setAiFeedback(feedback);
                setShowAiModal(true);

            } catch (aiError) {
                console.log("AI Failed, but entry saved:", aiError);
                // If AI fails, just go back
                navigation.goBack();
            }

        } catch (error) {
            console.error("Save Error:", error);
            Alert.alert("Error", "Could not save entry. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const closeAiModal = () => {
        setShowAiModal(false);
        // Navigate Home only after closing modal
        navigation.reset({
            index: 0,
            routes: [{ name: 'App' }],
        });
    };

    return {
        selections,
        notes,
        loading,
        handleTextChange,
        handleSave,
        aiFeedback,
        showAiModal,
        closeAiModal
    };
};