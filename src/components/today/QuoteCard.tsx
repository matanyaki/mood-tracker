import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Quote } from 'lucide-react-native';
import SkeletonBox from '../skeleton/SkeletonBox';
import { GC_TIME_MS } from '../../hooks/queryConfig';
import { dayKeyFromMillis } from '../../../shared/utils/streak';
import { CARD_PADDING } from '../../constants/layout';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';

interface ZenQuote {
    q: string; // Quote
    a: string; // Author
}

/** Shown only when today's quote could not be fetched at all -- never as a first paint. */
const FALLBACK_QUOTE: ZenQuote = {
    q: "The only way to do great work is to love what you do.",
    a: "Steve Jobs"
};

const fetchTodaysQuote = async (): Promise<ZenQuote> => {
    // A short timeout so a slow network fails over to the fallback instead of
    // holding the skeleton indefinitely.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch('https://zenquotes.io/api/today', { signal: controller.signal });
        if (!response.ok) throw new Error(`ZenQuotes answered ${response.status}`);

        const data: ZenQuote[] = await response.json();
        if (!data || data.length === 0) throw new Error('ZenQuotes returned no quote');

        return { q: data[0].q, a: data[0].a };
    } finally {
        clearTimeout(timeoutId);
    }
};

export default function QuoteCard() {
    // Keyed by the local day: the persisted cache paints today's quote instantly on
    // every reopen, while yesterday's entry simply does not match -- so a new day shows
    // a skeleton and then today's quote, never yesterday's quote swapped out in front
    // of the reader. The quote cannot change within its day, so it is never refetched.
    const today = dayKeyFromMillis(Date.now(), new Date().getTimezoneOffset());
    const { data, isPending } = useQuery<ZenQuote>({
        queryKey: ['quote', today],
        queryFn: fetchTodaysQuote,
        staleTime: Infinity,
        gcTime: GC_TIME_MS,
        retry: 1,
    });

    const quote = data ?? FALLBACK_QUOTE;

    return (
        <View style={styles.wrapper}>
            {/* Hard offset block = pixel-art drop shadow (no blur) */}
            <View style={styles.pixelShadow} pointerEvents="none" />

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
            >
                <View style={styles.headerRow}>
                    <Quote size={18} color={ACCENT} fill={ACCENT} strokeWidth={2.5} />
                    <Text style={styles.cardTitle}>[ DAILY INSPIRATION ]</Text>
                </View>

                {isPending ? (
                    // Two quote lines and an author line, each at its real line height.
                    <View>
                        <View style={styles.skeletonQuote}>
                            <SkeletonBox height={13} borderRadius={0} />
                            <SkeletonBox width="70%" height={13} borderRadius={0} />
                        </View>
                        <View style={styles.footerRow}>
                            <SkeletonBox width={90} height={11} borderRadius={0} />
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.quoteText}>"{quote.q}"</Text>

                        <View style={styles.footerRow}>
                            <Text style={styles.authorText}>- {quote.a}</Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

// Pixel-art palette (same pinks as before)
const INK = '#831843';     // Darkest pink, used as the "ink" outline
const PAPER = '#FDF2F8';   // Pale pink card fill
const ACCENT = '#DB2777';  // Pink accent
const LABEL = '#BE185D';   // Title / author pink

const styles = StyleSheet.create({
    wrapper: {
        // Room for the offset pixel shadow on both edges it falls on. The gap to the
        // next card is CARD_GAP, applied once by the screen -- not here.
        position: 'relative',
        marginBottom: 6,
        marginRight: 6,
    },
    pixelShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: INK,
        transform: [{ translateX: 6 }, { translateY: 6 }],
    },
    card: {
        backgroundColor: PAPER,
        padding: CARD_PADDING,
        borderWidth: 3,
        borderColor: INK,
        borderLeftWidth: 10,
        borderLeftColor: ACCENT,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 12,
        gap: 8,
        borderBottomWidth: 3,
        borderBottomColor: INK,
    },
    cardTitle: {
        fontSize: 10,
        color: LABEL,
        fontFamily: PIXEL_BOLD,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    quoteText: {
        fontSize: 13,
        color: INK,
        lineHeight: 22,
        fontFamily: PIXEL,
        marginBottom: 12,
    },
    skeletonQuote: {
        // Matches quoteText: two 22pt lines and the same gap above the footer.
        gap: 9,
        paddingVertical: 4,
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: ACCENT,
        borderStyle: 'dotted',
    },
    authorText: {
        fontSize: 11,
        color: LABEL,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
});
