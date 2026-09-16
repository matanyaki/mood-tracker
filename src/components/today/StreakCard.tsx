import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from '../skeleton/SkeletonBox';
import { useStreaksQuery } from '../../hooks/useStreaksQuery';
import { PIXEL_BOLD } from '../../constants/typography';
import { CARD_PADDING } from '../../constants/layout';
import { INK, INK_MUTED } from '../../constants/pixel';

/** Streak orange. The flame is the streak's icon, so it keeps this colour on both
 *  tiles -- the tile LABEL says which kind of entry it counts, not the colour. */
const FLAME = '#EA580C';

/** A streak of zero has no flame to light: the icon goes grey until it does. */
const COLD = '#94A3B8';

/**
 * Height of a tile's contents: the label line, and the value under it.
 *
 * Fixed, and shared by every state -- a count, a dormant tile, the skeleton, the
 * failed fetch -- so the cards below never shift when the numbers arrive or the
 * last streak breaks.
 */
const TILE_H = 40;

interface StreakTileProps {
    label: string;
    /** The count, or null when it could not be loaded at all. */
    streak: number | null;
    onPress: () => void;
}

/**
 * One streak, as its own small card: flame and label, with the value under them.
 *
 * Stacked rather than on one line because the tile is half a screen wide before its
 * padding and accent bar come out of it, and "GREETINGS" plus an icon plus a count
 * does not fit what is left in Silkscreen.
 *
 * Three values, one control. A live streak shows the day count; a streak of zero
 * shows START and greys the flame, and the tile itself is the way in -- there is no
 * separate button, because a dormant tile has nothing to report and may as well be
 * the invitation. A failed fetch shows RETRY, never a zero: telling someone their
 * streak is gone when it is only unreachable is the one wrong answer here.
 */
function StreakTile({ label, streak, onPress }: StreakTileProps) {
    const isActive = streak !== null && streak > 0;

    return (
        <PixelCard
            padding={CARD_PADDING}
            accentColor={isActive ? FLAME : COLD}
            wrapperStyle={styles.tile}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.tileBody, pressed && styles.tileBodyPressed]}
            >
                <View style={styles.labelRow}>
                    <Flame size={14} color={isActive ? FLAME : COLD} strokeWidth={3} />
                    <Text style={styles.label} numberOfLines={1}>{label}</Text>
                </View>

                <Text style={[styles.value, !isActive && styles.valueDormant]}>
                    {streak === null ? 'RETRY' : isActive ? `${streak}d` : 'START'}
                </Text>
            </Pressable>
        </PixelCard>
    );
}

interface StreakCardProps {
    /** Opens the emotion input. */
    onPressEmotions: () => void;
    /** Opens the greeting input. */
    onPressGreetings: () => void;
}

/**
 * The two daily streaks, counted by the server from the entries already stored.
 *
 * One small card each, side by side: the two counts are separate facts about
 * separate things, and a shared card had to draw a divider to say so anyway.
 *
 * Fetches its own data the way QuoteCard and IntentionCard do, so the screen only
 * has to say where the two tiles lead. That matters here: the emotion input is a
 * route and the greeting input is a modal owned by TodayScreen, so the tiles cannot
 * navigate on their own.
 */
export default function StreakCard({ onPressEmotions, onPressGreetings }: StreakCardProps) {
    // `data` is either fresh or restored from the persisted cache and already checked
    // against today (useStreaksQuery's select), so it is never a guess. With neither,
    // the tiles hold a skeleton -- they never paint a placeholder count to replace later.
    const { data, isPending, refetch } = useStreaksQuery();

    const retry = useCallback(() => { refetch(); }, [refetch]);

    // Nothing fresh and nothing persisted. Both tiles become the retry, since neither
    // count survived the failed request. The reason is already in the log, from the
    // service -- there is no room for it on a tile this size.
    const failed = !data && !isPending;

    if (isPending) {
        // Two boxes at a tile's height, so the row does not resize when the counts land.
        return (
            <View style={styles.row}>
                <PixelCard padding={CARD_PADDING} accentColor={COLD} wrapperStyle={styles.tile}>
                    <SkeletonBox height={TILE_H} borderRadius={0} />
                </PixelCard>
                <PixelCard padding={CARD_PADDING} accentColor={COLD} wrapperStyle={styles.tile}>
                    <SkeletonBox height={TILE_H} borderRadius={0} />
                </PixelCard>
            </View>
        );
    }

    return (
        <View style={styles.row}>
            <StreakTile
                label="EMOTIONS"
                streak={data ? data.emotionStreak : null}
                onPress={failed ? retry : onPressEmotions}
            />
            <StreakTile
                label="GREETINGS"
                streak={data ? data.greetingStreak : null}
                onPress={failed ? retry : onPressGreetings}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    tile: {
        flex: 1,
    },
    tileBody: {
        // One fixed height for every state, so the column below never moves.
        height: TILE_H,
        justifyContent: 'space-between',
    },
    tileBodyPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        flex: 1,
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    value: {
        fontSize: 16,
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
    valueDormant: {
        fontSize: 10,
        color: INK_MUTED,
        letterSpacing: 1,
    },
});
