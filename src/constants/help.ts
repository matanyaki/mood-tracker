/**
 * Everything the Help screen says, as data. Edit the copy here; HelpScreen only
 * lays it out.
 *
 * Each answer describes the app as it behaves today -- if a feature changes, the
 * matching answer here has to change with it.
 */

export interface HelpItem {
    question: string;
    answer: string;
}

export interface HelpSection {
    title: string;
    items: HelpItem[];
}

export const HELP_SECTIONS: HelpSection[] = [
    {
        title: 'GETTING STARTED',
        items: [
            {
                question: 'What is this app for?',
                answer:
                    'It gives you a minute a day to notice how you feel. Log your emotions, write a few words about them, and over time the calendar and Insights show you patterns you might not see day to day.',
            },
            {
                question: 'How do I check in?',
                answer:
                    'On the Today screen, tap the + button and choose Emotions (or tap the Emotions streak tile).\n\nStep 1: pick every emotion that fits and rate each one from 1 to 5.\nStep 2: write a few words about each one, then tap Save.',
            },
            {
                question: 'Can I check in more than once a day?',
                answer:
                    'Yes, as often as you like. Each check-in is saved on its own. For your streak and your mood score, a day counts once no matter how many check-ins it has.',
            },
            {
                question: 'Do I need an account?',
                answer:
                    "No. As a guest, everything is saved on this phone only. Create an account from the Profile tab to back your history up and use it on another device. Anything you logged as a guest moves into your account automatically when you sign up.",
            },
        ],
    },
    {
        title: 'EMOTIONS',
        items: [
            {
                question: 'What do the 9 emotions mean?',
                answer:
                    "They run from pleasant to heavy:\n\nHappy, Excited, Calm: the good-feeling ones.\nConfused, Bored, Tired: everyday in-between states.\nSad, Anxious, Angry: the heavier ones.\n\nPick whatever is closest. There are no wrong answers.",
            },
            {
                question: 'What does the 1-5 rating mean?',
                answer:
                    'How strongly you feel it. 1 is a light touch, 5 is something that fills your whole day.',
            },
            {
                question: 'What if I feel more than one thing?',
                answer:
                    "Select them all. Mixed feelings are normal, and you'll get a reflection step for each one.",
            },
        ],
    },
    {
        title: 'TODAY',
        items: [
            {
                question: 'What is a greeting?',
                answer:
                    "A short gratitude note: one thing you're grateful for today. Tap + and choose Greeting. Stuck? Tap HINT for a prompt.",
            },
            {
                question: 'What is the intention card?',
                answer:
                    'One line about how you want to approach today ("Today I will..."). It stays on this phone and starts fresh every day.',
            },
            {
                question: 'How do streaks work?',
                answer:
                    "There are two. Emotions counts the days in a row you checked in, and Greetings counts the days in a row you wrote a gratitude note.\n\nIf you logged yesterday, your streak is still alive today. You have until the end of the day. Miss a whole day and it starts again from zero.",
            },
        ],
    },
    {
        title: 'GOALS',
        items: [
            {
                question: 'How do I create a goal?',
                answer:
                    'Tap + on the Today screen, choose Goals, then add a new one. Give it a name, a start date, how many months it runs, how many times a week, which days, and what time of day.',
            },
            {
                question: 'How do I mark a goal as done?',
                answer:
                    "Tick it on the Today screen's goals card. A goal is done once per day, even if it runs at more than one time of day. A ticked box can't be unticked.",
            },
            {
                question: "What's the difference between pause and delete?",
                answer:
                    "Pause when you need a break: the goal stops being scheduled, paused days don't count as missed, and Resume picks up where you left off.\n\nDelete is for goals made by mistake. It removes the goal and its history.",
            },
        ],
    },
    {
        title: 'CALENDAR & INSIGHTS',
        items: [
            {
                question: 'What do the dots on the calendar mean?',
                answer:
                    'Each day shows a dot for what you logged: a mood check-in, a greeting, or a goal. Tap any day to see everything from it.',
            },
            {
                question: 'What is the mood score?',
                answer:
                    "A 0-100 snapshot of how your month has felt. Pleasant feelings lift it and heavier ones bring it down. Stronger feelings count for more, and every day counts equally. The arrow compares it with last month.\n\nAround 50 is a balanced month. It's a snapshot, not a grade.",
            },
        ],
    },
    {
        title: 'YOUR ACCOUNT',
        items: [
            {
                question: 'Where is my data kept?',
                answer:
                    "As a guest, on this phone only. Deleting the app deletes it. With an account, it's stored securely in the cloud and only you can see it.",
            },
            {
                question: 'How do I change my name or password?',
                answer:
                    'Go to Profile, then Edit Profile. You can change your name there, or tap Reset Password and we\'ll email you a link.',
            },
        ],
    },
];

/**
 * Shown at the top of the Help screen.
 *
 * findahelpline.com lists free, confidential lines for most countries, so it works
 * wherever the user is.
 */
export const CRISIS_SUPPORT = {
    title: 'NEED TO TALK TO SOMEONE?',
    body:
        "This app is a journal, not a replacement for real support. If you're struggling, a free, confidential helpline can help. If you're in danger, call your local emergency number.",
    linkLabel: 'FIND A HELPLINE',
    url: 'https://www.eran.org.il/online-emotional-help/',
};
