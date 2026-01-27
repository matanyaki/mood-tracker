import { EMOTION_WHEEL } from '../constants/emotions';

/**
 * Recursively finds an emotion object by its ID or Label in the Emotion Wheel.
 */
export const findEmotion = (key: string): any => {
    if (!key) return null;
    const searchKey = key.toLowerCase();

    // BFS or Recursive Search
    // Since depth is small (3), recursion is fine.
    const search = (list: any[]): any => {
        for (const item of list) {
            if (item.id.toLowerCase() === searchKey || item.label.toLowerCase() === searchKey) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return null;
    };

    return search(EMOTION_WHEEL);
};

/**
 * Enhances specific colors for better visibility/aesthetics.
 */
const enhanceColor = (color: string): string => {
    const colorMap: Record<string, string> = {
        '#FFFF99': '#F59E0B', '#84C5F4': '#3B82F6', '#9CA3AF': '#6B7280',
        '#FF6666': '#EF4444', '#FCD34D': '#F97316', '#86EFAC': '#10B981',
        '#C4B5FD': '#8B5CF6',
    };
    return colorMap[color] || color;
};

/**
 * Gets the color for a given emotion.
 * If the emotion is a child/grandchild, it returns the color of its root ancestor.
 */
export const getEmotionColor = (emotionName: string): string => {
    const found = findEmotion(emotionName);
    if (!found) return '#6B7280';

    // If the emotion object itself has a color (it's a root), return it.
    if (found.color) return enhanceColor(found.color);

    // Otherwise, find its root to get the color
    const root = getRootEmotion(emotionName);
    return root && root.color ? enhanceColor(root.color) : '#6B7280';
};

/**
 * Returns the Root Emotion object for any given descendant emotion ID/Label.
 */
export const getRootEmotion = (selectionOrId: any): any => {
    const id = typeof selectionOrId === 'string' ? selectionOrId : selectionOrId?.id;
    if (!id) return null;

    return EMOTION_WHEEL.find(e =>
        e.id === id ||
        e.children?.some(c =>
            c.id === id ||
            c.children?.some(gc => gc.id === id)
        )
    );
};
