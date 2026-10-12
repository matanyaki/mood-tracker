import type { LucideIcon } from 'lucide-react-native';
import { Moon, Footprints, Wind, Users, PenLine, Smartphone, Leaf, Apple } from 'lucide-react-native';

/**
 * Everything the Tips screen shows, as data. Add, edit or reorder tips here;
 * TipsScreen only lays them out.
 *
 * Keep each tip small and doable today -- one action, not a lifestyle. These are
 * everyday wellbeing habits, not medical advice, so nothing here should promise
 * to fix anything.
 *
 * Within a category, list tips easy → hard. The screen sorts by level anyway,
 * but keeping the source in that order keeps the tip-of-the-day walk sensible.
 */

export type TipLevel = 'easy' | 'medium' | 'hard';

export interface Tip {
    title: string;
    body: string;
    /** How much effort it takes: a one-off minute, a small habit, or a real change. */
    level: TipLevel;
}

export interface TipCategory {
    id: string;
    title: string;
    icon: LucideIcon;
    /** Icon and accent colour. */
    color: string;
    /** Flat, opaque swatch behind the icon. */
    tint: string;
    tips: Tip[];
}

/** How each difficulty is drawn. `rank` is the sort order and the number of filled pips. */
export const TIP_LEVELS: Record<TipLevel, { label: string; rank: 1 | 2 | 3; color: string; tint: string }> = {
    easy: { label: 'EASY', rank: 1, color: '#15803D', tint: '#DCFCE7' },
    medium: { label: 'MEDIUM', rank: 2, color: '#B45309', tint: '#FEF3C7' },
    hard: { label: 'HARD', rank: 3, color: '#B91C1C', tint: '#FEE2E2' },
};

export const byLevel = (a: Tip, b: Tip) => TIP_LEVELS[a.level].rank - TIP_LEVELS[b.level].rank;

export const TIP_CATEGORIES: TipCategory[] = [
    {
        id: 'sleep',
        title: 'SLEEP',
        icon: Moon,
        color: '#4338CA',
        tint: '#E0E7FF',
        tips: [
            {
                title: 'Cut caffeine after lunch',
                body: 'Caffeine can stay in your system for hours. Try to have your last coffee or energy drink before 2pm.',
                level: 'easy',
            },
            {
                title: 'Dim the last hour',
                body: 'Lower the lights and put screens away an hour before bed. Bright light late at night tells your brain it is still daytime.',
                level: 'medium',
            },
            {
                title: "Can't sleep? Get up",
                body: "If you've been awake in bed for about 20 minutes, get up and do something quiet in dim light until you feel sleepy. It keeps your bed linked with sleep, not with lying awake.",
                level: 'medium',
            },
            {
                title: 'Keep the same wake-up time',
                body: 'Getting up at the same time every day, weekends too, steadies your body clock more than an early bedtime does.',
                level: 'hard',
            },
        ],
    },
    {
        id: 'movement',
        title: 'MOVEMENT',
        icon: Footprints,
        color: '#C2410C',
        tint: '#FFEDD5',
        tips: [
            {
                title: 'Stretch when you stand up',
                body: 'Every time you get up from your desk, take 30 seconds to stretch your neck, shoulders and back.',
                level: 'easy',
            },
            {
                title: 'Move to one song',
                body: 'Put on a song you love and move for the whole track. Dancing counts as exercise.',
                level: 'easy',
            },
            {
                title: 'Take a 10-minute walk',
                body: 'A short walk, especially outside, is one of the quickest ways to lift your mood and clear your head.',
                level: 'medium',
            },
            {
                title: 'Make it a goal',
                body: "Pick one activity and add it as a goal in the app, like a walk three times a week. Small and regular beats big and rare.",
                level: 'hard',
            },
        ],
    },
    {
        id: 'calm',
        title: 'BREATHING & CALM',
        icon: Wind,
        color: '#0F766E',
        tint: '#CCFBF1',
        tips: [
            {
                title: 'Name the feeling',
                body: "Just putting a feeling into words (\"I'm anxious\") can take some of the edge off. That's what a check-in does.",
                level: 'easy',
            },
            {
                title: 'Make the out-breath longer',
                body: 'Breathe in for 4 and out for 6. A long, slow out-breath helps your body switch out of alert mode.',
                level: 'easy',
            },
            {
                title: 'Box breathing',
                body: 'Breathe in for 4, hold for 4, breathe out for 4, hold for 4. Repeat four times. It slows your heart rate down when you feel tense.',
                level: 'medium',
            },
            {
                title: '5-4-3-2-1 grounding',
                body: "When anxiety spins up, name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell and 1 you can taste. It pulls your attention back to right now.",
                level: 'hard',
            },
        ],
    },
    {
        id: 'connection',
        title: 'CONNECTION',
        icon: Users,
        color: '#BE185D',
        tint: '#FCE7F3',
        tips: [
            {
                title: 'Send one message',
                body: "Text someone you haven't talked to in a while. Something as simple as \"thought of you today\" is enough.",
                level: 'easy',
            },
            {
                title: 'Be present for one conversation',
                body: 'Put your phone away for one conversation today and give the other person your full attention.',
                level: 'medium',
            },
            {
                title: 'Call instead of texting',
                body: 'Hearing a voice feels more connecting than reading words. Try one call this week instead of a chat.',
                level: 'medium',
            },
            {
                title: 'Ask for help early',
                body: "You don't have to wait until things are bad to talk to someone. Telling a friend you're having a hard week is a strength.",
                level: 'hard',
            },
        ],
    },
    {
        id: 'journaling',
        title: 'GRATITUDE & JOURNALING',
        icon: PenLine,
        color: '#A16207',
        tint: '#FEF9C3',
        tips: [
            {
                title: 'Be specific',
                body: '"The coffee my friend brought me" stays with you longer than "my friends". Small, specific moments count the most.',
                level: 'easy',
            },
            {
                title: 'Set an intention',
                body: 'Write one line in the intention card each morning. Choosing how you want the day to go makes it more likely it will.',
                level: 'easy',
            },
            {
                title: 'Look back once a month',
                body: "Open Insights at the end of the month and read back through your calendar. You'll often notice that hard stretches passed sooner than they felt.",
                level: 'medium',
            },
            {
                title: 'Write it down while it still stings',
                body: 'Check in on hard days too, not just good ones. A few honest words help you make sense of a feeling instead of carrying it around.',
                level: 'hard',
            },
        ],
    },
    {
        id: 'screens',
        title: 'SCREEN TIME',
        icon: Smartphone,
        color: '#475569',
        tint: '#E2E8F0',
        tips: [
            {
                title: 'Notice how scrolling makes you feel',
                body: 'After 10 minutes on social media, check in with yourself. If you feel worse, that is useful to know.',
                level: 'easy',
            },
            {
                title: 'Turn off non-human notifications',
                body: "Keep notifications for messages from real people and switch off the rest. Fewer pings, fewer interruptions.",
                level: 'medium',
            },
            {
                title: 'Phone-free first 30 minutes',
                body: 'Start the day with something other than news and notifications. Your mood gets set before the world gets a say.',
                level: 'hard',
            },
            {
                title: 'Charge it outside the bedroom',
                body: "Leave your phone to charge in another room overnight. You'll scroll less in bed and sleep better.",
                level: 'hard',
            },
        ],
    },
    {
        id: 'nature',
        title: 'NATURE & LIGHT',
        icon: Leaf,
        color: '#15803D',
        tint: '#DCFCE7',
        tips: [
            {
                title: 'Look at the sky',
                body: 'Step outside and look up for a minute. Looking far away gives your eyes and mind a break from screens.',
                level: 'easy',
            },
            {
                title: 'Find some green',
                body: "A park, a tree-lined street or a few plants at home. Even a short time around nature can lower stress.",
                level: 'medium',
            },
            {
                title: 'Get morning light',
                body: 'Spend 10 minutes outside in the morning, even if it is cloudy. Daylight early in the day helps you feel awake and sleep better at night.',
                level: 'hard',
            },
        ],
    },
    {
        id: 'nourish',
        title: 'NOURISHMENT',
        icon: Apple,
        color: '#B91C1C',
        tint: '#FEE2E2',
        tips: [
            {
                title: 'Drink a glass of water first',
                body: 'Feeling tired, foggy or irritable can come from being a little dehydrated. Have a glass of water before you reach for anything else.',
                level: 'easy',
            },
            {
                title: 'Eat one meal slowly',
                body: 'Have one meal today without a screen. Notice the taste and how full you feel.',
                level: 'medium',
            },
            {
                title: "Don't skip meals",
                body: 'Going too long without eating makes your mood dip. Regular meals keep your energy steadier through the day.',
                level: 'hard',
            },
        ],
    },
];

/**
 * One tip for today, the same all day and different tomorrow.
 *
 * Counts days since the epoch in local time, so it changes at the user's midnight,
 * and walks every tip in order before repeating.
 */
export function getTipOfTheDay(now: Date = new Date()): { tip: Tip; category: TipCategory } {
    const all = TIP_CATEGORIES.flatMap(category => category.tips.map(tip => ({ tip, category })));
    const localDay = Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
    return all[localDay % all.length];
}
