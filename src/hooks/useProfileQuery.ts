import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@shared/types';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { STALE_TIME_MS, GC_TIME_MS, retryTransportFailures } from './queryConfig';

/**
 * Fetches GET /api/users/me — the signed-in user's name and join date.
 *
 * Guests have no profile, so the query stays disabled until someone signs in.
 * The key carries no uid; AuthContext resets every query when the account
 * changes, so one account's name never shows on another's card.
 *
 * useEditProfileController writes the saved profile straight into ['profile'],
 * so the card updates without a refetch.
 */
export function useProfileQuery() {
    const { user } = useAuth();

    return useQuery<UserProfile | null>({
        queryKey: ['profile'],
        queryFn: UserService.getProfile,
        enabled: !!user,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: retryTransportFailures,
    });
}
