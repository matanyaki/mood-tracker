// The taxonomy itself lives in shared/types/emotions.ts so the server schema and
// the client agree on one list. This module only re-exports it under the names
// existing call sites already use.
import { EMOTIONS } from '../../shared/types/emotions';

export { EMOTIONS };
export type { EmotionId } from '../../shared/types/emotions';

/** Alias kept for existing call sites (CheckInScreen, InsightsScreen, Insights/*). */
export const EMOTIONS_CONFIG = EMOTIONS;
