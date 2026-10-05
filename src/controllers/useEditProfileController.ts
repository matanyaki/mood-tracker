import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sendPasswordResetEmail } from 'firebase/auth';
import { DisplayNameSchema } from '../../shared/types';
import { auth } from '../config/firebase';
import { UserService } from '../services/userService';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { getAuthErrorMessage } from '../utils/authErrors';

/**
 * State and actions for EditProfileScreen: the name field, saving it, and sending
 * a password reset email.
 */
export const useEditProfileController = () => {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useProfileQuery();

    const savedName = profile?.displayName ?? '';
    const [name, setName] = useState(savedName);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    // The screen can open before the profile arrives. Fill the field once it does,
    // but only if the user hasn't started typing.
    useEffect(() => {
        setName(current => (current === '' ? savedName : current));
    }, [savedName]);

    const parsed = DisplayNameSchema.safeParse(name);
    const validationError = parsed.success ? null : parsed.error.issues[0].message;
    const hasChanges = parsed.success && parsed.data !== savedName;

    /** Resolves true once the name is saved, false if it wasn't. */
    const saveProfile = useCallback(async (): Promise<boolean> => {
        if (!parsed.success || !hasChanges || isSaving) return false;

        setIsSaving(true);
        try {
            const updated = await UserService.updateProfile({ displayName: parsed.data });
            queryClient.setQueryData(['profile'], updated);
            return true;
        } finally {
            setIsSaving(false);
        }
    }, [parsed, hasChanges, isSaving, queryClient]);

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
        validationError,
        hasChanges,
        isSaving,
        saveProfile,
        isSendingReset,
        sendPasswordReset,
    };
};
