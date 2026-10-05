/**
 * Turns a Firebase Auth error into a sentence a user can act on.
 *
 * Firebase's own `error.message` reads like "Firebase: Error (auth/invalid-credential)."
 * — fine for a log, useless on screen. Anything unrecognised falls back to a generic
 * line rather than leaking the raw message.
 *
 * Note: projects created after Sept 2023 have email enumeration protection on, so a
 * wrong password and an unknown email both arrive as `auth/invalid-credential` and
 * cannot be told apart.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    // Login
    'auth/invalid-credential': 'Wrong email or password. Please try again.',
    'auth/wrong-password': 'Wrong password. Please try again.',
    'auth/user-not-found': 'No account found with this email. Try signing up instead.',
    'auth/invalid-login-credentials': 'Wrong email or password. Please try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',

    // Sign up
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
    'auth/weak-password': 'Password is too short. Use at least 6 characters.',
    'auth/password-does-not-meet-requirements': 'Password is too weak. Try a longer one.',

    // Either
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/missing-email': 'Please enter your email.',
    'auth/missing-password': 'Please enter your password.',
    'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
    'auth/timeout': 'The request timed out. Check your connection and try again.',
    'auth/internal-error': 'Something went wrong on our side. Please try again.',
    'auth/operation-not-allowed': 'Email sign-in is currently unavailable.',
};

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export const MIN_PASSWORD_LENGTH = 6;

export const getAuthErrorMessage = (error: unknown): string => {
    const code = (error as { code?: unknown } | null)?.code;
    if (typeof code === 'string' && AUTH_ERROR_MESSAGES[code]) {
        return AUTH_ERROR_MESSAGES[code];
    }
    return FALLBACK_MESSAGE;
};

/** Checks the form before it reaches Firebase. Returns an error message, or null if it's fine. */
export const validateAuthForm = (email: string, password: string, isSignUp: boolean): string | null => {
    const trimmed = email.trim();
    if (!trimmed && !password) return 'Please enter your email and password.';
    if (!trimmed) return 'Please enter your email.';
    if (!password) return 'Please enter your password.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'That email address doesn\'t look right.';
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
        return `Password is too short. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
};
