import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import type { StreakSummary } from '@shared/types';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from '../skeleton/SkeletonBox';
import { useStreaksQuery } from '../../hooks/useStreaksQuery';
import { actingUserId } from '../../hooks/queryConfig';
import { StreakService } from '../../services/streakService';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, INK, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

/** Streak orange. The flame is the streak's icon, so it keeps this colour in both
 *  rows -- the row LABEL says which kind of entry it counts, not the colour. */
const FLAME = '#EA580C';
const FLAME_TINT = '#FFEDD5';

/** A streak of zero has no flame to light: the icon box goes grey until it does. */
const COLD = '#F1F5F9';

interface StreakRowProps {
    label: string;
    streak: number;
    /** Copy for the button shown in place of a count when the streak is 0. */
    startLabel: string;
    onStart: () => void;
}

/**
 * One streak line: icon, label, and either the count or the way to start one.
 *
 * The button sits on its own line rather than to the right of the label because
 * Silkscreen is wide -- "[ START GREETING STREAK ]" alongside a label and an icon
 * overflows a phone-width card.
 */
function StreakRow({ label, streak, startLabel, onStart }: StreakRowProps) {
    const isActive = streak > 0;

    return (
        <View>
            <View style={styles.rowTop}>
                <View style={[styles.iconBox, { backgroundColor: isActive ? FLAME_TINT : COLD }]}>
                    <Flame size={18} color={isActive ? FLAME : INK_MUTED} strokeWidth={3} />
                </View>

                <Text style={styles.rowLabel}>{label}</Text>

                {isActive && (
                    <View style={styles.countGroup}>
                        <Text style={styles.count}>{streak}</Text>
                        <Text style={styles.countLabel}>{streak === 1 ? 'DAY' : 'DAYS'}</Text>
                    </View>
                )}
            </View>

            {!isActive && (
                <Pressable
                    onPress={onStart}
                    style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
                >
                    <Text style={styles.startText}>{startLabel}</Text>
                </Pressable>
            )}
        </View>
    );
}

interface StreakCardProps {
    /** Opens the emotion input. */
    onStartEmotion: () => void;
    /** Opens the greeting input. */
    onStartGreeting: () => void;
}

/**
 * The two daily streaks, counted by the server from the entries already stored.
 *
 * Fetches its own data the way QuoteCard and IntentionCard do, so the screen only
 * has to say where the two "start" buttons lead. That matters here: the emotion
 * input is a route and the greeting input is a modal owned by TodayScreen, so the
 * card cannot navigate to both itself.
 */
export default function StreakCard({ onStartEmotion, onStartGreeting }: StreakCardProps) {
    const { data, isLoading, error, refetch } = useStreaksQuery();

    // Last known counts, read from the device while the query runs.
    //
    // TanStack's cache is memory-only, so without this the card holds a skeleton for
    // a full round trip on EVERY app launch -- and for up to half a minute when the
    // request times out and gets retried. Showing yesterday's number and correcting
    // it a moment later beats showing nothing at all.
    const [cached, setCached] = useState<StreakSummary | null>(null);

    useEffect(() => {
        let active = true;

        StreakService.getCachedStreaks(actingUserId()).then(summary => {
            if (active) setCached(summary);
        });

        return () => { active = false; };
    }, []);

    // Fresh data always wins; the cache only fills the gap before it arrives.
    const summary = data ?? cached;

    return (
        <PixelCard padding={16} accentColor={FLAME}>
            <Text style={styles.eyebrow}>[ STREAKS ]</Text>

            {summary ? (
                <View>
                    <StreakRow
                        label="EMOTIONS"
                        streak={summary.emotionStreak}
                        startLabel="[ START YOUR STREAK ]"
                        onStart={onStartEmotion}
                    />
                    <View style={styles.divider}>
                        <StreakRow
                            label="GREETINGS"
                            streak={summary.greetingStreak}
                            startLabel="[ START GREETING STREAK ]"
                            onStart={onStartGreeting}
                        />
                    </View>
                </View>
            ) : isLoading ? (
                // Only reached with nothing cached -- a first run, or a new account.
                // Two placeholder lines at the height of a real row, so the card does
                // not resize under the reader when the counts arrive.
                <View>
                    <View style={styles.skeletonRow}>
                        <SkeletonBox width={34} height={34} borderRadius={0} />
                        <SkeletonBox width={110} height={14} borderRadius={0} />
                    </View>
                    <View style={[styles.skeletonRow, styles.divider]}>
                        <SkeletonBox width={34} height={34} borderRadius={0} />
                        <SkeletonBox width={110} height={14} borderRadius={0} />
                    </View>
                </View>
            ) : (
                // Nothing fresh, nothing cached. A failed fetch must not be drawn as a
                // streak of zero -- that tells the user they lost a streak they still have.
                <View style={styles.errorBlock}>
                    <Text style={styles.errorText}>
                        {(error as Error)?.message ?? 'Could not load your streaks.'}
                    </Text>
                    <Pressable
                        onPress={() => refetch()}
                        style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
                    >
                        <Text style={styles.startText}>[ TRY AGAIN ]</Text>
                    </Pressable>
                </View>
            )}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    eyebrow: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: FLAME,
        letterSpacing: 2,
        marginBottom: 14,
    },
    divider: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        // Square and outlined, matching the stat boxes on Insights.
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    rowLabel: {
        flex: 1, // Pushes the count to the right edge
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    countGroup: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    count: {
        fontSize: 24,
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
    countLabel: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    startButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
        backgroundColor: FLAME_TINT,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    startButtonPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#FDE2C4',
    },
    startText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorBlock: {
        alignItems: 'center',
    },
    errorText: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 20,
        textAlign: 'center',
    },
});
