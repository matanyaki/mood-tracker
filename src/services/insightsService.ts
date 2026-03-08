import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import { JournalEntry } from '../models/JournalEntry';

const GUEST_STORAGE_KEY = '@guest_journal_entries';

export const InsightsService = {
    getInsightsData: async (): Promise<JournalEntry[]> => {
        try {
            const user = auth.currentUser;
            if (!user) {
                // --- LOCAL STORAGE ---
                const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
                const entries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
                return entries.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                // --- API (Authenticated) ---
                const token = await user.getIdToken();

                const url = `${API_BASE_URL}/api/insights`;
                console.log(`[InsightsService] Fetching GET ${url}`);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch insights data: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                return result.data as JournalEntry[];
            }
        } catch (error) {
            console.error("Error [InsightsService.getInsightsData]:", error);
            throw error;
        }
    }
};
