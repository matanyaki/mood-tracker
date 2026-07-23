import { userRepository } from '../repositories/userRepository';
import { rethrow } from '../middleware/errorHandler';
import type { UserProfile, CreateUserProfileDTO } from '../../../shared/types';

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
