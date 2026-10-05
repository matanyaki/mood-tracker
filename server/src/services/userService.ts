import { userRepository } from '../repositories/userRepository';
import { AppError, rethrow } from '../middleware/errorHandler';
import type { UserProfile, CreateUserProfileDTO, UpdateProfileBody } from '../../../shared/types';

class UserService {
    /**
     * Sync user profile. Creates it if absent.
     *
     * The repository's create is transactional and idempotent, so the previous
     * service-level findById check has been removed: it cost an extra read and
     * still raced, since two concurrent syncs could both pass it.
     */
    async syncUser(user: Pick<CreateUserProfileDTO, 'uid' | 'email'>): Promise<void> {
        try {
            await userRepository.create({ uid: user.uid, email: user.email || '' });
        } catch (error: unknown) {
            rethrow(error, 'Failed to sync user profile');
        }
    }

    /**
     * Increment the user's total entry count and stamp today's check-in date.
     * Delegates to an atomic server-side increment — no read-modify-write.
     */
    async incrementEntryCount(userId: string): Promise<void> {
        try {
            await userRepository.incrementEntryStats(userId);
        } catch (error: unknown) {
            rethrow(error, 'Failed to increment entry count');
        }
    }

    /**
     * Apply the user's own edits and return the profile as it now stands.
     *
     * The profile is ensured first: it is created by the background sync on sign-in,
     * and if that request never landed the update would otherwise 404 on an edit the
     * user has every right to make.
     */
    async updateProfile(
        user: Pick<CreateUserProfileDTO, 'uid' | 'email'>,
        data: UpdateProfileBody
    ): Promise<UserProfile> {
        try {
            await userRepository.create({ uid: user.uid, email: user.email || '' });
            await userRepository.update(user.uid, data);

            const profile = await userRepository.findById(user.uid);
            if (!profile) throw new AppError('User profile not found.', 404);
            return profile;
        } catch (error: unknown) {
            return rethrow(error, 'Failed to update user profile');
        }
    }

    /**
     * Fetch user profile.
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        try {
            return await userRepository.findById(userId);
        } catch (error: unknown) {
            return rethrow(error, 'Failed to fetch user profile');
        }
    }
}

export default new UserService();
