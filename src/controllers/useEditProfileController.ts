import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sendPasswordResetEmail } from 'firebase/auth';
import { DisplayNameSchema, UpdateProfileBody } from '../../shared/types';
import { auth } from '../config/firebase';
import { UserService } from '../services/userService';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { getAuthErrorMessage } from '../utils/authErrors';

/**
 * State and actions for EditProfileScreen: the name field and avatar, saving them,
 * and sending a password reset email.
 */
export const useEditProfileController = () => {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useProfileQuery();

    const savedName = profile?.displayName ?? '';
    const savedAvatarId = profile?.avatarId ?? null;
    const [name, setName] = useState(savedName);
    const [avatarId, setAvatarId] = useState<string | null>(savedAvatarId);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    // The screen can open before the profile arrives. Fill the fields once it does,
    // but only if the user hasn't already changed them.
    useEffect(() => {
        setName(current => (current === '' ? savedName : current));
    }, [savedName]);
    useEffect(() => {
        setAvatarId(current => current ?? savedAvatarId);
    }, [savedAvatarId]);

    const parsed = DisplayNameSchema.safeParse(name);
    const validationError = parsed.success ? null : parsed.error.issues[0].message;
    const nameChanged = name.trim() !== savedName;
    const avatarChanged = !!avatarId && avatarId !== savedAvatarId;
    // An untouched name doesn't block saving a new avatar, even if it's still empty.
    const hasChanges = (!nameChanged || parsed.success) && (nameChanged || avatarChanged);

    /** Resolves true once the changes are saved, false if there was nothing to save. */
    const saveProfile = useCallback(async (): Promise<boolean> => {
        if (!hasChanges || isSaving) return false;

        const body: UpdateProfileBody = {};
        if (nameChanged && parsed.success) body.displayName = parsed.data;
        if (avatarChanged && avatarId) body.avatarId = avatarId;

        setIsSaving(true);
        try {
            const updated = await UserService.updateProfile(body);
            queryClient.setQueryData(['profile'], updated);
            return true;
        } finally {
            setIsSaving(false);
        }
    }, [parsed, nameChanged, avatarChanged, avatarId, hasChanges, isSaving, queryClient]);

    /**
     * Reset by email rather than an in-app change form: Firebase would demand a fresh
     * sign-in before changing the password here, and the email flow is the one users
     * already know from every other app.
     */
    const sendPasswordReset = useCallback(async (): Promise<string> => {
        const email = auth.currentUser?.email;
        if (!email) throw new Error('This account has no email address.');

        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return email;
        } catch (error) {
            throw new Error(getAuthErrorMessage(error));
        } finally {
            setIsSendingReset(false);
        }
    }, []);

    return {
        email: auth.currentUser?.email ?? '',
        isLoading,
        name, setName,
        avatarId, setAvatarId,
        // Only worth showing once they've touched the field.
        validationError: nameChanged ? validationError : null,
        hasChanges,
        isSaving,
        saveProfile,
        isSendingReset,
        sendPasswordReset,
    };
};
