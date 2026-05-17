import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import { JournalEntry } from '../models/JournalEntry';

const GUEST_STORAGE_KEY = '@guest_journal_entries';

export const InsightsService = {
    getInsightsData: async (days: number = 30): Promise<JournalEntry[]> => {
        try {
            const user = auth.currentUser;
            if (!user) {
                // --- LOCAL STORAGE ---
                const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
                let entries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
                
                // Filter local entries by days
                const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
                entries = entries.filter(e => e.timestamp >= cutoff);
                
                return entries.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                // --- API (Authenticated) ---
                const token = await user.getIdToken();

                const url = `${API_BASE_URL}/api/insights?days=${days}`;
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
