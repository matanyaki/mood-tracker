import { userRepository, UserProfile, CreateUserProfileDTO } from '../repositories/userRepository';

class UserService {
    /**
     * Sync user profile. Create if doesn't exist.
     */
    async syncUser(user: any): Promise<void> {
        try {
            const existingProfile = await userRepository.findById(user.uid);

            if (!existingProfile) {
                const newProfile: CreateUserProfileDTO = {
                    uid: user.uid,
                    email: user.email || ''
                };
                await userRepository.create(newProfile);
            }
        } catch (error: any) {
            console.error("Error syncing user profile:", error);
            throw error;
        }
    }

    /**
     * Increment user's total entry count and update last check-in date.
     */
    async incrementEntryCount(userId: string): Promise<void> {
        try {
            const userProfile = await userRepository.findById(userId);
            
            if (userProfile) {
                const currentStats = userProfile.stats || { totalEntries: 0, currentStreak: 0 };
                
                await userRepository.update(userId, {
                    stats: {
                        ...currentStats,
                        totalEntries: currentStats.totalEntries + 1,
                        lastCheckInDate: new Date().toISOString().split('T')[0]
                    }
                });
            }
        } catch (error: any) {
            console.error("Error incrementing entry count:", error);
            throw error;
        }
    }

    /**
     * Fetch user profile.
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        try {
            return await userRepository.findById(userId);
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            throw error;
        }
    }
}

export default new UserService();
