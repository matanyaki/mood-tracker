import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import type { EmotionId } from '@shared/types';

export type { EmotionId };

export interface EmotionSelection {
    id: EmotionId;
    label: string;
    scale: number; // 1-5
}

export const useCheckInController = () => {
    const [selections, setSelections] = useState<EmotionSelection[]>([]);

    const updateScale = useCallback((id: string, label: string, newScale: number) => {
        const emotionId = id as EmotionId;

        setSelections(prev => {
            if (newScale === 0) {
                // Remove if scale is 0
                return prev.filter(e => e.id !== emotionId);
            }

            const exists = prev.find(e => e.id === emotionId);
            if (exists) {
                // Update existing
                return prev.map(e => e.id === emotionId ? { ...e, scale: newScale } : e);
            } else {
                // Add new
                return [...prev, { id: emotionId, label, scale: newScale }];
            }
        });
    }, []);

    const getScale = useCallback((id: string) => selections.find(e => e.id === id)?.scale || 0, [selections]);

    const canSubmit = useMemo(() => selections.length > 0, [selections]);

    const submitCheckIn = useCallback(() => {
        if (selections.length === 0) {
            Alert.alert("Selection Required", "Please select at least one emotion to check in.");
            return null;
        }
        return selections;
    }, [selections]);

    return {
        selections,
        updateScale,
        getScale,
        canSubmit,
        submitCheckIn
    };
};