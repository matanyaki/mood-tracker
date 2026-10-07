import React, { useMemo, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { getEmotionImageKey, resolveEmotionId } from '../../../shared/types/emotions';
import PixelCard from '../ui/PixelCard';
import { MONTH_NAMES } from './FilterRow';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';
import { MOOD_IMAGES } from '../../constants/images';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

/**
 * The one card on Insights that talks rather than counts.
 *
 * Everything below it reports the month -- how many entries, which emotions, how
 * the wave ran. This one reads those same numbers back as a sentence, and it sits
 * first because a bad month is exactly when the numbers land worst: a chart that
 * dips is not something to meet before someone has told you it is survivable.
 *
 * Under the sentence sits the month as a strip of days -- one cell per day,
 * filled with the feeling that led it -- so the gaps are visible without being
 * scolded about, and any day can be tapped to see what was logged. In the current
 * month, a day not yet logged gets a check-in button rather than a lecture.
 *
 * Drawn in the same pixel frame as the cards below it, but filled rather than
 * paper, so it reads as the loudest thing on the screen.
 */

/** The card's fill and its face. Off the taxonomy -- calm is the steady one. */
const ANCHOR_EMOTION = 'calm';
const ACCENT = getEmotionColor(ANCHOR_EMOTION);

/**
 * Journaled days (and entries) a month needs before it is read for a shape at
 * all. Under this the card says so instead: two days is a start, not a trend,
 * and a reassurance drawn from them is one the data cannot back.
 */
export const MIN_FOR_A_READ = 3;

/** A day scores in [-1, 1]. Below this it counts as a low. */
const LOW_DAY = -0.2;

/** How many later journaled days a low has to lift inside to count as recovered. */
const RECOVERY_WINDOW = 3;

/** How far the month has to move, half against half, to be called up or down. */
const TREND_STEP = 0.15;

/** Empty cell in the day strip: a day that has passed with nothing logged. */
const EMPTY_DAY = '#F1F5F9';

/**
 * Valence per emotion id, straight off the taxonomy's own order: EMOTIONS runs
 * pleasant -> unpleasant, so an emotion's position in it already is its rank.
 * Spread over +1 (first) .. -1 (last), which makes a day's score a weighted
 * average rather than a count of "bad" emotions.
 */
const EMOTION_VALENCE: Record<string, number> = Object.fromEntries(
    EMOTIONS_CONFIG.map((e, i) => [e.id, 1 - (2 * i) / (EMOTIONS_CONFIG.length - 1)])
);

const EMOTION_LABEL: Record<string, string> = Object.fromEntries(
    EMOTIONS_CONFIG.map(e => [e.id, e.label])
);

/** "1 DAY" / "3 DAYS". Silkscreen is too wide to spend on "(S)". */
const countLabel = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One journaled day, shaped to what the screen's aggregation hands over. */
export interface DayEntry {
    date: string;
    emotions?: { id: string; scale: number }[];
}

interface MonthRead {
    daysJournaled: number;
    hasLows: boolean;
    lowsRecovered: boolean;
    trend: 'up' | 'flat' | 'down';
    /** Label of the emotion logged on the most days, or null when none resolve. */
    topEmotion: string | null;
}

/** Where the month sits against today. The copy changes tense on it. */
type MonthTiming = 'past' | 'current' | 'future';

interface MonthContext {
    timing: MonthTiming;
    loggedToday: boolean;
}

/**
 * A day's emotions folded onto the taxonomy, strongest first. Retired ids go
 * through the resolver; anything still unknown, or logged without a scale, is
 * dropped rather than guessed at.
 */
function dayEmotions(day: DayEntry): { id: string; scale: number }[] {
    return (day.emotions ?? [])
        .map(e => ({ id: resolveEmotionId(e.id), scale: e.scale }))
        .filter((e): e is { id: NonNullable<typeof e.id>; scale: number } => !!e.id && e.scale > 0)
        .sort((a, b) => b.scale - a.scale);
}

/**
 * A day on a -1 (all unpleasant) .. +1 (all pleasant) line, each emotion weighted
 * by the intensity it was logged at.
 *
 * `null` for a day carrying nothing usable -- an id outside the taxonomy, or no
 * scale -- so it is skipped rather than counted as the neutral day it never was.
 */
function scoreDay(day: DayEntry): number | null {
    let weighted = 0;
    let weight = 0;

    dayEmotions(day).forEach(e => {
        weighted += EMOTION_VALENCE[e.id] * e.scale;
        weight += e.scale;
    });

    return weight > 0 ? weighted / weight : null;
}

/**
 * The emotion that turned up on the most days, ties going to the one felt more
 * strongly overall. Counted in days, like everything else on the card, so one
 * day with five entries cannot make itself the month's feeling.
 */
function topEmotionOf(days: DayEntry[]): string | null {
    const tally: Record<string, { days: number; weight: number }> = {};

    days.forEach(day => {
        const seen = new Set<string>();
        dayEmotions(day).forEach(e => {
            const t = (tally[e.id] ??= { days: 0, weight: 0 });
            t.weight += e.scale;
            if (!seen.has(e.id)) {
                t.days++;
                seen.add(e.id);
            }
        });
    });

    const best = Object.entries(tally).sort(
        ([, a], [, b]) => b.days - a.days || b.weight - a.weight
    )[0];

    return best ? EMOTION_LABEL[best[0]] : null;
}

/** The things the copy is allowed to claim, read off the month's days. */
function readMonth(days: DayEntry[]): MonthRead {
    const scores = [...days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(scoreDay)
        .filter((score): score is number => score !== null);

    let lows = 0;
    let recovered = 0;

    scores.forEach((score, i) => {
        if (score >= LOW_DAY) return;
        lows++;

        // "Soon after" is counted in journaled days, not calendar days: a gap in
        // the log is silence, not a run of low days, and reading it as one would
        // hold a dip open for however long someone went without writing.
        const lifted = scores
            .slice(i + 1, i + 1 + RECOVERY_WINDOW)
            .some(later => later > LOW_DAY);

        if (lifted) recovered++;
    });

    // The back half of the month against the front half. A regression line would
    // be more precise and no more honest at this many points.
    let trend: MonthRead['trend'] = 'flat';
    if (scores.length >= 4) {
        const mean = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
        const mid = Math.floor(scores.length / 2);
        const move = mean(scores.slice(mid)) - mean(scores.slice(0, mid));

        if (move > TREND_STEP) trend = 'up';
        else if (move < -TREND_STEP) trend = 'down';
    }

    return {
        // Every day that was written on, including any that scored null: showing
        // up is the claim here, and an unreadable entry is still someone showing up.
        daysJournaled: days.length,
        hasLows: lows > 0,
        lowsRecovered: lows > 0 && recovered === lows,
        trend,
        topEmotion: topEmotionOf(days),
    };
}

/**
 * The sentence the card exists for.
 *
 * Every branch rests on something that stays true in a bad month -- that they
 * showed up, that lows passed, what they felt most. None of them reads the mood
 * as high, and the heavy branch does not say "you're okay": a month that is
 * genuinely going badly is granted, not argued with.
 *
 * A thin month is where the card asks for more, and only there: it says how many
 * more days until the month can be read, so the ask is a number, not a guilt trip.
 *
 * `totalEntries` is only a confidence check. It never appears in the sentence --
 * days are what showing up is counted in -- but a month that is one busy day is
 * not a month there is anything to say about.
 */
export function pickReassurance(
    month: string,
    read: MonthRead,
    totalEntries: number,
    { timing, loggedToday }: MonthContext,
): string {
    const { daysJournaled, hasLows, lowsRecovered, trend, topEmotion } = read;
    const days = countLabel(daysJournaled, 'DAY', 'DAYS');
    const top = topEmotion?.toUpperCase();
    const isNow = timing === 'current';

    if (timing === 'future') {
        return `${month} HASN'T STARTED YET. YOUR STORY FOR IT WILL SHOW UP HERE.`;
    }

    if (daysJournaled === 0) {
        return isNow
            ? `${month} IS A BLANK PAGE SO FAR. ONE QUICK CHECK-IN IS ALL IT TAKES TO START.`
            : `NOTHING WAS LOGGED IN ${month}. THAT'S OKAY — EVERY MONTH IS A FRESH START.`;
    }

    if (daysJournaled < MIN_FOR_A_READ || totalEntries < MIN_FOR_A_READ) {
        if (!isNow) {
            return `YOU LOGGED ${days} IN ${month} — A REAL START. A FEW MORE CHECK-INS NEXT TIME WILL SHOW THE BIGGER PICTURE.`;
        }
        const need = Math.max(MIN_FOR_A_READ - daysJournaled, 1);
        const feltMost = top ? `, MOSTLY ${top}` : '';
        const nudge = loggedToday ? 'COME BACK TOMORROW' : 'CHECK IN TODAY';
        return `YOU'VE LOGGED ${days} SO FAR${feltMost}. ${countLabel(need, 'MORE DAY', 'MORE DAYS')} AND YOUR MONTH STARTS TO TAKE SHAPE — ${nudge}.`;
    }

    if (trend === 'down' || (hasLows && !lowsRecovered)) {
        return `THIS ${isNow ? 'HAS BEEN' : 'WAS'} A HEAVY STRETCH — AND YOU STILL SHOWED UP ${days}. THAT COUNTS. BE GENTLE WITH YOURSELF.`;
    }

    if (hasLows) {
        const feltMost = top ? ` ${top} CAME UP MOST.` : '';
        return `${month} HAD ITS DIPS, BUT EVERY LOW WAS FOLLOWED BY A LIFT. YOU SHOWED UP ${days}.${feltMost} YOU'RE OKAY.`;
    }

    if (trend === 'up') {
        const feltMost = top ? `, MOSTLY ${top}` : '';
        return `${month} ${isNow ? 'IS TRENDING' : 'TRENDED'} UP — YOUR LATER DAYS FELT LIGHTER THAN THE EARLY ONES. ${days} LOGGED${feltMost}. KEEP IT GOING.`;
    }

    const feltMost = top ? `, WITH ${top} SHOWING UP MOST` : '';
    return `${month} ${isNow ? 'IS HOLDING' : 'HELD'} STEADY — ${days} LOGGED${feltMost}. YOU'RE OKAY.`;
}

/** Points per day: + for a day checked in on, - for one that passed without. */
const POINTS_PER_DAY = 1;
/**
 * The most showing up (or not) can move the score, either way. Uncapped, a fully
 * logged month adds 30 and "around 50 is balanced" stops meaning anything --
 * the score has to stay mostly about how the month felt.
 */
const MAX_DAY_POINTS = 10;
/** Points per goal day completed, and the most goals can add in a month. Kept small
 *  on purpose, so ticking goals can't stand in for checking in with yourself. */
const POINTS_PER_GOAL = 1;
const MAX_GOAL_POINTS = 3;

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

/** What the score adds on top of how the month felt. */
export interface ScoreExtras {
    /** Days that have had their chance to be logged -- see countableDays. */
    countableDays: number;
    /** Goal days marked done in the month. */
    goalsDone: number;
}

/**
 * The month's mood on a 0..100 line: the mean of its day scores, moved off
 * [-1, 1]. A neutral month lands on 50, an all-pleasant one on 100.
 *
 * Off the same scoreDay the sentence above reads, so the number and the card
 * can never disagree about what a good day was. Days that score null are
 * skipped, as readMonth skips them. `null` when nothing in the month scores.
 *
 * With `extras`, a small nudge on top: a point for each day checked in on and
 * one off for each day missed (capped at MAX_DAY_POINTS either way), and a point
 * per goal day done (capped at MAX_GOAL_POINTS). Still `null` for a month with
 * no feelings in it -- missed days alone don't make a mood.
 */
export function monthlyMoodScore(days: DayEntry[], extras?: ScoreExtras): number | null {
    const dayScores = days
        .map(scoreDay)
        .filter((score): score is number => score !== null);

    if (dayScores.length === 0) return null;

    const mean = dayScores.reduce((sum, x) => sum + x, 0) / dayScores.length;
    const feltScore = ((mean + 1) / 2) * 100;
    if (!extras) return Math.round(feltScore);

    const logged = days.length;
    const missed = Math.max(0, extras.countableDays - logged);
    const dayPoints = clamp((logged - missed) * POINTS_PER_DAY, -MAX_DAY_POINTS, MAX_DAY_POINTS);
    const goalPoints = Math.min(extras.goalsDone * POINTS_PER_GOAL, MAX_GOAL_POINTS);

    return Math.round(clamp(feltScore + dayPoints + goalPoints, 0, 100));
}

/**
 * How many days of a month count toward showing up.
 *
 * Starts at whichever came first, the account or the month's first entry, so a
 * new user isn't marked down for the days before they had the app. Ends
 * yesterday in the current month -- today only counts once it's logged, so a
 * day still in progress is never a missed one. A whole month once it's over.
 *
 * `since` is the account's first day as 'YYYY-MM-DD' (undefined for guests).
 * `days` must all fall inside the month.
 */
export function countableDays(
    year: number,
    monthIndex: number,
    days: DayEntry[],
    since?: string,
    now: Date = new Date(),
): number {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const isCurrent = year === now.getFullYear() && monthIndex === now.getMonth();
    const isFuture = year > now.getFullYear() || (year === now.getFullYear() && monthIndex > now.getMonth());
    if (isFuture) return 0;

    const dayOf = (date: string) => parseInt(date.split('-')[2], 10);
    const loggedDays = days.map(d => dayOf(d.date)).filter(d => d >= 1);

    let lastDay = daysInMonth;
    if (isCurrent) {
        const today = now.getDate();
        lastDay = loggedDays.includes(today) ? today : today - 1;
    }

    // The account's first day, moved onto this month's day numbers.
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    let sinceDay: number | undefined;
    if (since) {
        sinceDay = since.slice(0, 7) < monthKey ? 1
            : since.slice(0, 7) === monthKey ? dayOf(since)
                : daysInMonth + 1;
    }

    const firstLogged = loggedDays.length ? Math.min(...loggedDays) : undefined;
    const firstDay = Math.min(sinceDay ?? Infinity, firstLogged ?? Infinity);
    if (!Number.isFinite(firstDay)) return 0;

    return Math.max(0, lastDay - firstDay + 1);
}

interface MonthlyReassuranceProps {
    /** 1-12, the month the filter above is showing. */
    month: string;
    /** Four digits, the year the filter above is showing. */
    year: string;
    /** One entry per journaled day of that month, already aggregated by the screen. */
    dayEntries: DayEntry[];
    /** Every entry in the month, days with several counted separately. */
    totalEntries: number;
    /** Opens a check-in. Offered only in the current month, before today is logged. */
    onCheckIn?: () => void;
}

export default function MonthlyReassurance({
    month,
    year,
    dayEntries,
    totalEntries,
    onCheckIn,
}: MonthlyReassuranceProps) {
    const monthIndex = parseInt(month, 10) - 1;
    const yearNum = parseInt(year, 10);
    const monthName = (MONTH_NAMES[monthIndex] ?? '').toUpperCase();
    const monthShort = monthName.slice(0, 3);
    const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

    // Read once per render: the card does not need to roll over at midnight
    // while it is on screen, only to be right when it is drawn.
    const now = new Date();
    const timing: MonthTiming =
        yearNum === now.getFullYear() && monthIndex === now.getMonth() ? 'current'
            : yearNum > now.getFullYear() || (yearNum === now.getFullYear() && monthIndex > now.getMonth()) ? 'future'
                : 'past';
    const today = timing === 'current' ? now.getDate() : null;

    /** Day of the month -> that day's entry. */
    const byDay = useMemo(() => {
        const map = new Map<number, DayEntry>();
        dayEntries.forEach(entry => {
            const day = parseInt(entry.date.split('-')[2], 10);
            if (day >= 1) map.set(day, entry);
        });
        return map;
    }, [dayEntries]);

    const read = useMemo(() => readMonth(dayEntries), [dayEntries]);
    const loggedToday = today !== null && byDay.has(today);
    const message = pickReassurance(monthName, read, totalEntries, { timing, loggedToday });

    // Days that have had their chance to be logged -- the denominator of the
    // "logged" count, so a month in progress is not measured against days that
    // have not happened yet.
    const daysSoFar = timing === 'current' ? now.getDate() : timing === 'past' ? daysInMonth : 0;

    // Tagged with the month it was picked in, so switching the filter drops the
    // selection instead of carrying "day 12" over to a different month.
    const monthKey = `${year}-${month}`;
    const [selection, setSelection] = useState<{ monthKey: string; day: number } | null>(null);
    const selectedDay = selection?.monthKey === monthKey ? selection.day : null;
    const setSelectedDay = (day: number | null) => setSelection(day === null ? null : { monthKey, day });

    // Two rows, however long the month: 14-16 cells across a phone-width card is
    // the most that still leaves each one big enough to tap.
    const columns = Math.ceil(daysInMonth / 2);
    const cellWidth = `${100 / columns}%` as const;

    const selectedEntry = selectedDay !== null ? byDay.get(selectedDay) : undefined;
    const selectedFeelings = selectedEntry
        ? dayEmotions(selectedEntry).map(e => EMOTION_LABEL[e.id].toUpperCase()).join(', ')
        : '';
    const peekText = selectedDay === null
        ? (read.daysJournaled > 0 ? 'TAP A DAY TO PEEK' : null)
        : `${monthShort} ${selectedDay}: ${selectedFeelings || 'NOTHING LOGGED'}`;

    return (
        <PixelCard padding={16} wrapperStyle={styles.cardWrapper} style={styles.card}>
            <View style={styles.header}>
                <View style={styles.faceBox}>
                    <Image
                        source={MOOD_IMAGES[getEmotionImageKey(ANCHOR_EMOTION)]}
                        style={styles.face}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.cardTitle}>YOUR MONTH</Text>
                    <Text style={styles.cardSubtitle}>Whatever else it was</Text>
                </View>
            </View>

            {/* The sentence sits on paper rather than straight on the fill: it is
                the longest run of text on the screen, and the one that has to stay
                readable on the day someone least wants to read it. */}
            <View style={styles.panel}>
                <Text style={styles.message}>{message}</Text>
            </View>

            <View style={[styles.panel, styles.stripPanel]}>
                <View style={styles.stripHeader}>
                    <Text style={styles.stripLabel}>DAYS LOGGED</Text>
                    <Text style={styles.stripCount}>
                        {read.daysJournaled} / {daysSoFar || daysInMonth}
                    </Text>
                </View>

                <View style={styles.strip}>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const entry = byDay.get(day);
                        const lead = entry ? dayEmotions(entry)[0] : undefined;
                        const isFuture = day > daysSoFar;
                        const isToday = day === today;
                        const isSelected = day === selectedDay;

                        return (
                            <Pressable
                                key={day}
                                disabled={isFuture}
                                onPress={() => setSelectedDay(isSelected ? null : day)}
                                style={[styles.cellSlot, { width: cellWidth }]}
                                accessibilityRole="button"
                                accessibilityLabel={`${MONTH_NAMES[monthIndex]} ${day}${entry ? ', logged' : ''}`}
                            >
                                <View
                                    style={[
                                        styles.cell,
                                        entry
                                            ? { backgroundColor: lead ? getEmotionColor(lead.id) : INK_MUTED }
                                            : null,
                                        isFuture && styles.cellFuture,
                                        isToday && styles.cellToday,
                                        isSelected && styles.cellSelected,
                                    ]}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                {peekText && (
                    <Text style={[styles.peek, selectedDay !== null && styles.peekActive]}>
                        {peekText}
                    </Text>
                )}
            </View>

            {/* Asked for only where it can be acted on: today, in this month,
                before anything is logged. A past month gets no nudge. */}
            {timing === 'current' && !loggedToday && onCheckIn && (
                <Pressable
                    onPress={onCheckIn}
                    style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                    accessibilityRole="button"
                >
                    <Text style={styles.ctaText}>+ CHECK IN TODAY</Text>
                </Pressable>
            )}
            {loggedToday && (
                <Text style={styles.stamp}>[ TODAY IS LOGGED — NICE ]</Text>
            )}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 20,
    },
    card: {
        // The one filled card on Insights. Everything below it is PAPER, so the
        // fill alone is what makes this the first thing the eye lands on.
        backgroundColor: ACCENT,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    faceBox: {
        // Square and outlined, the same treatment as the SummaryCards icon boxes,
        // with paper behind the face so it reads against the fill.
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    face: {
        width: 28,
        height: 28,
    },
    headerText: {
        // Takes the rest of the row so a title can never push the face off it.
        flex: 1,
    },
    // Title and subtitle carry the sizes EmotionBreakdown and GoalsProgress use,
    // in INK rather than INK_MUTED: muted slate on the fill is not a contrast the
    // subtitle survives.
    cardTitle: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    cardSubtitle: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK,
        letterSpacing: 0.5,
        marginTop: 6,
    },
    panel: {
        padding: 12,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    message: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
        lineHeight: 20,
    },
    stripPanel: {
        marginTop: 10,
    },
    stripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    stripLabel: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    stripCount: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    strip: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // The slots' own padding is the gutter; this cancels it at the edges so
        // the strip lines up with the text above it.
        marginHorizontal: -1.5,
    },
    cellSlot: {
        padding: 1.5,
    },
    cell: {
        aspectRatio: 1,
        backgroundColor: EMPTY_DAY,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    cellFuture: {
        // Days that have not happened are drawn, so the month keeps its length,
        // but faded so they never read as missed.
        opacity: 0.3,
    },
    cellToday: {
        borderColor: INK,
    },
    cellSelected: {
        borderColor: INK,
        borderWidth: 3,
    },
    peek: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        marginTop: 8,
    },
    peekActive: {
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
    cta: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    ctaPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    ctaText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    stamp: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
        marginTop: 10,
    },
});
