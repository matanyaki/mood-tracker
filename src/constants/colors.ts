export const EMOTION_COLORS = {
    happy: '#F59E0B',    // Amber
    sad: '#3B82F6',      // Blue
    worry: '#8B5CF6',    // Violet
    fear: '#10B981',     // Emerald
    angry: '#EF4444',    // Red
    neutral: '#6B7280',  // Gray
};

export const getEmotionColor = (id: string): string => {
    const key = id?.toLowerCase();
    // Use type assertion or check if key exists in object to avoid TypeScript errors if strict
    return (EMOTION_COLORS as Record<string, string>)[key] || EMOTION_COLORS.neutral;
};
