import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, startOfDay, isSameDay } from 'date-fns';
import { JournalService } from './journalService';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import type { JournalEntry } from '@shared/types';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';

const GUEST_STORAGE_KEY = '@guest_journal_entries';


export const InsightsService = {
    getInsightsData: async (days?: number): Promise<JournalEntry[]> => {
        try {
            const user = auth.currentUser;
            if (!user) {
                // --- LOCAL STORAGE ---
                const existingEntriesJson = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
                let entries: JournalEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

                // Filter local entries by days if specified
                if (days) {
                    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
                    entries = entries.filter(e => e.timestamp >= cutoff);
                }

                return entries.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                // --- API (Authenticated) ---
                const token = await user.getIdToken();

                const url = days
                    ? `${API_BASE_URL}/api/insights?days=${days}`
                    : `${API_BASE_URL}/api/insights`;
                console.log(`[InsightsService] Fetching GET ${url}`);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log(`[Frontend] Insights API Status:`, response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch insights data: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                console.log(`[Frontend] Insights API Raw Result Data Length:`, result?.data?.length);
                return result.data as JournalEntry[];
            }
        } catch (error) {
            console.error("Error [InsightsService.getInsightsData]:", error);
            throw error;
        }
    }
};
