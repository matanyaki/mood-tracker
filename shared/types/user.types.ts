import { z } from 'zod';

export const UserPreferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notificationsEnabled: z.boolean().default(false),
    premiumStatus: z.boolean().optional(),
    dailyReminderTime: z.string().optional(), // "20:00"
});

export const UserStatsSchema = z.object({
    totalEntries: z.number().default(0),
    currentStreak: z.number().default(0),
    lastCheckInDate: z.string().optional(),
});

export const UserProfileSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    displayName: z.string().optional(),
    photoURL: z.string().optional(),
    /** Preset avatar, a key of AVATAR_IMAGES. Unset (or unknown to this build) shows the initial. */
    avatarId: z.string().optional(),
    createdAt: z.any().optional(),
    preferences: UserPreferencesSchema,
    stats: UserStatsSchema,
});

/** What a user may call themselves. Trimmed first, so "   " is empty rather than three characters. */
export const DisplayNameSchema = z.string().trim().min(1, 'Enter a name.').max(30, 'Keep it under 30 characters.');

/**
 * A preset avatar id ("avatar-042"). Checked for shape only: the art ships in the
 * app bundle, so the server can't know which ids a given build has. Same pattern
 * scripts/generate-avatars.js enforces on file names.
 */
export const AvatarIdSchema = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Unknown avatar.');

/**
 * Body of `PATCH /api/users/me`: any of the editable fields, at least one. Strict,
 * so the profile's other fields — stats, preferences, email — can't be written
 * through it.
 */
export const UpdateProfileBodySchema = z.object({
    displayName: DisplayNameSchema.optional(),
    avatarId: AvatarIdSchema.optional(),
}).strict().refine(body => Object.keys(body).length > 0, 'Nothing to update.');

export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type CreateUserProfileDTO = Omit<UserProfile, 'createdAt' | 'preferences' | 'stats'>;
export type UpdateUserProfileDTO = Partial<Omit<UserProfile, 'uid' | 'createdAt'>>;
