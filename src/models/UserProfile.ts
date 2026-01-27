// src/models/UserProfile.ts
import { z } from 'zod';

// 1. The Schema
export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    displayName: z.string().optional(),
    photoURL: z.string().optional(),
    createdAt: z.string(),

    // Settings (Modular!)
    preferences: z.object({
        theme: z.enum(['light', 'dark', 'system']).default('system'),
        notificationsEnabled: z.boolean().default(false),
        dailyReminderTime: z.string().optional(), // "20:00"
    }),

    // Gamification Stats
    stats: z.object({
        totalEntries: z.number().default(0),
        currentStreak: z.number().default(0),
        lastCheckInDate: z.string().optional(),
    })
});

// 2. The Type
export type UserProfile = z.infer<typeof UserProfileSchema>;