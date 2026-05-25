export interface UserPreferences {
    theme: string;
    notificationsEnabled: boolean;
    premiumStatus?: boolean;
}

export interface UserStats {
    totalEntries: number;
    currentStreak: number;
    lastCheckInDate?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    createdAt?: any;
    preferences: UserPreferences;
    stats: UserStats;
}

export type CreateUserProfileDTO = Omit<UserProfile, 'createdAt' | 'preferences' | 'stats'>;
export type UpdateUserProfileDTO = Partial<Omit<UserProfile, 'uid' | 'createdAt'>>;
