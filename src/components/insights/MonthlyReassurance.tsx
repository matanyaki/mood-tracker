import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getEmotionImageKey, resolveEmotionId } from '../../../shared/types/emotions';
import PixelCard from '../ui/PixelCard';
import { MONTH_NAMES } from './FilterRow';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';
import { MOOD_IMAGES } from '../../constants/images';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, BORDER_W_INNER } from '../../constants/pixel';

/**
 * The one card on Insights that talks rather than counts.
 *
 * Everything below it reports the month -- how many entries, which emotions, how
 * the wave ran. This one reads those same numbers back as a sentence, and it sits
 * first because a bad month is exactly when the numbers land worst: a chart that
 * dips is not something to meet before someone has told you it is survivable.
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
const MIN_FOR_A_READ = 3;

/** A day scores in [-1, 1]. Below this it counts as a low. */
const LOW_DAY = -0.2;

/** How many later journaled days a low has to lift inside to count as recovered. */
const RECOVERY_WINDOW = 3;

/** How far the month has to move, half against half, to be called up or down. */
const TREND_STEP = 0.15;

/**
 * Valence per emotion id, straight off the taxonomy's own order: EMOTIONS runs
 * pleasant -> unpleasant, so an emotion's position in it already is its rank.
 * Spread over +1 (first) .. -1 (last), which makes a day's score a weighted
 * average rather than a count of "bad" emotions.
 */
const EMOTION_VALENCE: Record<string, number> = Object.fromEntries(
    EMOTIONS_CONFIG.map((e, i) => [e.id, 1 - (2 * i) / (EMOTIONS_CONFIG.length - 1)])
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

    (day.emotions ?? []).forEach(e => {
        // Through the taxonomy's resolver, so a day logged under a retired id
        // still scores instead of dropping out of the month.
        const id = resolveEmotionId(e.id);
        const valence = id ? EMOTION_VALENCE[id] : undefined;
        if (valence === undefined || !(e.scale > 0)) return;

        weighted += valence * e.scale;
        weight += e.scale;
    });

    return weight > 0 ? weighted / weight : null;
}

/** The three things the copy is allowed to claim, read off the month's days. */
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
    };
}

/**
 * The sentence the card exists for.
 *
 * Every branch rests on something that stays true in a bad month -- that they
 * showed up, that lows passed, that they felt a range. None of them reads the
 * mood as high, and the heavy branch does not say "you're okay": a month that is
 * genuinely going badly is granted, not argued with.
 *
 * `totalEntries` is only a confidence check. It never appears in the sentence --
 * days are what showing up is counted in -- but a month that is one busy day is
 * not a month there is anything to say about.
 */
export function pickReassurance(month: string, read: MonthRead, totalEntries: number): string {
    const { daysJournaled, hasLows, lowsRecovered, trend } = read;
    const days = countLabel(daysJournaled, 'DAY', 'DAYS');

    if (daysJournaled === 0) {
        return `NOTHING LOGGED IN ${month} YET. CHECK IN WHEN YOU'RE READY.`;
    }

    if (daysJournaled < MIN_FOR_A_READ || totalEntries < MIN_FOR_A_READ) {
        return `YOU'VE LOGGED ${days} THIS MONTH. KEEP CHECKING IN.`;
    }

    if (trend === 'down' || (hasLows && !lowsRecovered)) {
        return `THIS HAS BEEN A HEAVY STRETCH — AND YOU STILL SHOWED UP ${days}. THAT COUNTS. BE GENTLE WITH YOURSELF.`;
    }

    if (hasLows) {
        return `${month} HAD ITS DIPS — YOU SHOWED UP ${days}. EVERY LOW WAS FOLLOWED BY A LIFT. YOU'RE OKAY.`;
    }

    return `${month} HELD STEADY — YOU SHOWED UP ${days} AND FELT THE WHOLE RANGE. YOU'RE OKAY.`;
}

interface MonthlyReassuranceProps {
    /** 1-12, the month the filter above is showing. */
    month: string;
    /** One entry per journaled day of that month, already aggregated by the screen. */
    dayEntries: DayEntry[];
    /** Every entry in the month, days with several counted separately. */
    totalEntries: number;
}

export default function MonthlyReassurance({ month, dayEntries, totalEntries }: MonthlyReassuranceProps) {
    const monthName = (MONTH_NAMES[parseInt(month, 10) - 1] ?? '').toUpperCase();

    const read = useMemo(() => readMonth(dayEntries), [dayEntries]);
    const message = pickReassurance(monthName, read, totalEntries);

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

            {totalEntries > 0 && (
                <View style={styles.stamps}>
                    <Text style={styles.stamp}>[ {countLabel(read.daysJournaled, 'DAY', 'DAYS')} ]</Text>
                    <Text style={styles.stamp}>[ {countLabel(totalEntries, 'ENTRY', 'ENTRIES')} ]</Text>
                </View>
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
    stamps: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
    },
    stamp: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
});
