export interface JournalEntry {
    id?: string;
    userId: string;
    date: string;       // YYYY-MM-DD
    timestamp: number;  // Unix timestamp from client
    emotions: Array<{
        id: string;
        label: string;
        scale: number;
        note?: string;
    }>;
    createdAt?: any;
    updatedAt?: any;
}

export type CreateJournalEntryDTO = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>;
