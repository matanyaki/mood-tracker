import { useState } from 'react';
import { Alert, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const useCheckInController = () => {
    const [finalSelections, setFinalSelections] = useState<any[]>([]);

    // Slightly Adjust size to fit 3 rings
    const WHEEL_SIZE = width * 0.96;

    // Logic: Handle Selection & Constraints
    // Added 'grandparent' argument
    const toggleSelection = (item: any, parent: any = null, grandparent: any = null) => {
        const isSelected = finalSelections.find(e => e.id === item.id);

        if (isSelected) {
            setFinalSelections(prev => prev.filter(e => e.id !== item.id));
        } else {
            if (finalSelections.length >= 3) {
                Alert.alert("Limit Reached", "You can only select up to 3 emotions.");
                return;
            }

            // --- PATH BUILDING LOGIC ---
            const path = [];

            // 1. Grandparent (e.g., "Happy")
            if (grandparent) path.push(grandparent.label);

            // 2. Parent (e.g., "Playful")
            if (parent) path.push(parent.label);

            // 3. Item itself (e.g., "Cheeky") is NOT added to path (it's the main label)
            // ---------------------------

            const selectionWithContext = {
                ...item,
                path: path
            };

            console.log(`Selected: ${item.label}, Path: ${path.join(' -> ')}`);

            setFinalSelections(prev => [...prev, selectionWithContext]);
        }
    };

    const isSelected = (id: string) => finalSelections.some(e => e.id === id);

    return {
        finalSelections,
        toggleSelection,
        isSelected,
        WHEEL_SIZE
    };
};