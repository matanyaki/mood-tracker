import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react-native';
import type { JournalEntry } from '@shared/types';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from '../skeleton/SkeletonBox';
import { useEntriesQuery } from '../../hooks/useEntriesQuery';
import { EMOTIONS } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';
import { MOOD_IMAGES } from '../../constants/images';
import { getEmotionImageKey } from '../../../shared/types/emotions';
import { CARD_PADDING } from '../../constants/layout';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { INK, INK_MUTED } from '../../constants/pixel';

/**
 * The colour the Diary already uses for an emotion pip, so an un-logged day is
 * accented with the same violet the calendar marks a logged one with. Once there IS
 * an entry, the card takes that emotion's own colour instead.
 */
const MOOD_ACCENT = '#A78BFA';

/**
 * Emoji sizes, in dp.
 *
 * Every asset is a single 103x103 PNG with no @2x/@3x variant, so the size that
 * keeps the grid crisp depends on the screen: RN scales the source by
 * `size * PixelRatio`, and anything above 103 physical pixels is an upscale, which
 * is where a bilinear filter turns pixel art to mush. 36dp is 108 at 3x and 72 at
 * 2x, 30dp is 90 and 60 -- at or under the source on every density a phone
 * actually ships with.
 */
const EMOJI = 36;
const TEASER_EMOJI = 30;

/** How many of the taxonomy to tease. Four fits the row under the headline. */
const TEASER_COUNT = 4;

/**
 * Fixed content height, so the card does not resize when today gets logged.
 *
 * Sized by the taller of the two states: the headline row (20) over the teaser
 * emoji (30), with the 6 between them.
 */
const BODY_H = 56;

interface EmotionCheckInCardProps {
    /** Opens the existing check-in route. This card never edits an entry itself. */
    onPress: () => void;
}

/**
 * The way into the check-in screen, and a readout of whether today has been logged.
 *
 * An entry point only: emotion selection, intensity and notes all belong to
 * CheckInScreen, and tapping anywhere here goes straight there in both states --
 * including after a check-in, so the entry can still be changed.
 *
 * Today is decided from the entry timestamps, exactly the way the Diary decides
 * which cell an entry belongs in. `entry.date` is NOT used: it is written from
 * `toISOString()`, so it is a UTC day, and west of Greenwich an evening entry
 * carries tomorrow's date.
 */
export default function EmotionCheckInCard({ onPress }: EmotionCheckInCardProps) {
    // Entries are FILED under that same UTC date, which is what the month query
    // filters on, while "today" below is the local day. A local day straddles two
    // UTC days and, twice a month, two UTC months -- so both are asked for. They
    // are usually the same string, and one key is one request.
    const localMonth = format(new Date(), 'yyyy-MM');
    const utcMonth = new Date().toISOString().slice(0, 7);
    const monthQuery = useEntriesQuery(localMonth);
    const utcMonthQuery = useEntriesQuery(utcMonth);

    const today = format(new Date(), 'yyyy-MM-dd');

    /**
     * The most recent entry logged today, if there is one.
     *
     * Latest rather than first: a day can hold several entries, and the card is
     * reporting how the user feels now, not how they felt this morning.
     */
    const todaysEntry = useMemo(() => {
        const all = [...(monthQuery.data ?? []), ...(utcMonthQuery.data ?? [])];

        return all.reduce<JournalEntry | null>((latest, entry) => {
            if (!entry.timestamp) return latest;
            if (format(new Date(entry.timestamp), 'yyyy-MM-dd') !== today) return latest;
            return !latest || entry.timestamp > latest.timestamp ? entry : latest;
        }, null);
    }, [monthQuery.data, utcMonthQuery.data, today]);

    // Only the month that decides the answer gates the card. A failed fetch falls
    // through to the un-logged state, which is the harmless way to be wrong here:
    // it offers the check-in screen, and that screen is the source of truth anyway.
    if (monthQuery.isLoading) {
        return (
            <PixelCard padding={CARD_PADDING} accentColor={MOOD_ACCENT}>
                <View style={styles.body}>
                    <SkeletonBox width={170} height={14} borderRadius={0} />
                    <SkeletonBox width={140} height={TEASER_EMOJI} borderRadius={0} />
                </View>
            </PixelCard>
        );
    }

    // --- Logged today: what was felt, and when ---
    if (todaysEntry) {
        const emotion = todaysEntry.emotions[0];
        const others = todaysEntry.emotions.length - 1;

        return (
            <PixelCard padding={CARD_PADDING} accentColor={getEmotionColor(emotion.id)}>
                <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [styles.body, styles.loggedBody, pressed && styles.bodyPressed]}
                >
                    <Image
                        source={MOOD_IMAGES[getEmotionImageKey(emotion.id)]}
                        style={styles.emoji}
                        resizeMode="contain"
                    />

                    <View style={styles.loggedText}>
                        <Text style={styles.headline} numberOfLines={1}>
                            {/* The entry may hold several emotions; the card names the
                                first and counts the rest rather than listing them. */}
                            Feeling {emotion.label.toLowerCase()}{others > 0 ? ` +${others}` : ''}
                        </Text>
                        <Text style={styles.meta}>
                            {format(new Date(todaysEntry.timestamp), 'h:mm a')} · UPDATE
                        </Text>
                    </View>

                    <ChevronRight size={20} color={INK_MUTED} strokeWidth={3} />
                </Pressable>
            </PixelCard>
        );
    }

    // --- Nothing logged yet: the ask, with the taxonomy as decoration ---
    return (
        <PixelCard padding={CARD_PADDING} accentColor={MOOD_ACCENT}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}
            >
                <View style={styles.headlineRow}>
                    <Text style={styles.headline}>How are you feeling?</Text>
                    <ChevronRight size={20} color={INK_MUTED} strokeWidth={3} />
                </View>

                {/* Decoration, not a picker -- the choosing happens on the check-in
                    screen, so these are not pressable and carry no selected state. */}
                <View style={styles.teaser} pointerEvents="none">
                    {EMOTIONS.slice(0, TEASER_COUNT).map(emotion => (
                        <Image
                            key={emotion.id}
                            source={MOOD_IMAGES[emotion.imageKey]}
                            style={styles.teaserEmoji}
                            resizeMode="contain"
                        />
                    ))}
                </View>
            </Pressable>
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    body: {
        // One height for both states, so the column below does not move when today
        // gets logged.
        height: BODY_H,
        justifyContent: 'space-between',
    },
    loggedBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bodyPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    headlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headline: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 0.5,
    },
    meta: {
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    emoji: {
        width: EMOJI,
        height: EMOJI,
    },
    loggedText: {
        flex: 1,
        gap: 4,
    },
    teaser: {
        flexDirection: 'row',
        gap: 2,
    },
    teaserEmoji: {
        width: TEASER_EMOJI,
        height: TEASER_EMOJI,
    },
});
