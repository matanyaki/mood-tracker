import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Quote } from 'lucide-react-native';
import SkeletonBox from '../skeleton/SkeletonBox';
import PixelCard from '../ui/PixelCard';
import { GC_TIME_MS } from '../../hooks/queryConfig';
import { dayKeyFromMillis } from '../../../shared/utils/streak';
import { CARD_PADDING, SPACE } from '../../constants/layout';
import { TYPE } from '../../constants/typography';

interface ZenQuote {
    q: string; // Quote
    a: string; // Author
}

/** Shown only when today's quote could not be fetched at all -- never as a first paint. */
const FALLBACK_QUOTE: ZenQuote = {
    q: "The only way to do great work is to love what you do.",
    a: "Steve Jobs"
};

const TODAY_URL = 'https://zenquotes.io/api/today';
const RANDOM_URL = 'https://zenquotes.io/api/random';

/**
 * The quote waiting for the next new day. It is fetched in the background as soon as
 * today's quote is on screen and persisted with the rest of the cache, so the first
 * open of a new day paints it at once instead of a skeleton.
 */
const NEXT_QUOTE_KEY = ['quote', 'next'] as const;

const fetchQuote = async (url: string): Promise<ZenQuote> => {
    // A short timeout so a slow network fails over to the fallback instead of
    // holding the skeleton indefinitely.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`ZenQuotes answered ${response.status}`);

        const data: ZenQuote[] = await response.json();
        if (!data || data.length === 0) throw new Error('ZenQuotes returned no quote');
        // Over the free rate limit ZenQuotes still answers 200, with a "Too many
        // requests" notice as the quote. Treat it as the failure it is, or it would be
        // shown (and buffered) as a real quote.
        if (data[0].a === 'zenquotes.io') throw new Error('ZenQuotes rate limit');

        return { q: data[0].q, a: data[0].a };
    } finally {
        clearTimeout(timeoutId);
    }
};

export default function QuoteCard() {
    const queryClient = useQueryClient();
    const bufferedQuote = () => queryClient.getQueryData<ZenQuote>(NEXT_QUOTE_KEY);

    // Keyed by the local day, and never refetched: a quote cannot change within its day.
    // A new day starts from the buffered quote, synchronously through `initialData`, so
    // there is neither a skeleton nor yesterday's quote swapped out in front of the reader.
    // The queryFn takes the buffer too, for a first render that ran before the persisted
    // cache was restored. Only with no buffer at all (first launch, or the background
    // fetch failed) does it go to the network, behind the skeleton.
    const today = dayKeyFromMillis(Date.now(), new Date().getTimezoneOffset());
    const { data, isPending } = useQuery<ZenQuote>({
        queryKey: ['quote', today],
        queryFn: async () => bufferedQuote() ?? fetchQuote(TODAY_URL),
        initialData: bufferedQuote,
        staleTime: Infinity,
        gcTime: GC_TIME_MS,
        retry: 1,
    });

    // Fill the buffer once today's quote is settled -- after it, so the two requests
    // never race for ZenQuotes' small per-IP limit. Observed here so it stays in memory
    // (and so in the persisted cache) for as long as the card exists.
    const { data: nextQuote } = useQuery<ZenQuote>({
        queryKey: NEXT_QUOTE_KEY,
        queryFn: () => fetchQuote(RANDOM_URL),
        staleTime: Infinity,
        gcTime: GC_TIME_MS,
        retry: 1,
        enabled: data !== undefined,
    });

    // The buffer is spent once it is today's quote (or happens to repeat it): clear it
    // and fetch a fresh one. A reset, not a refetch, so a failed fetch leaves the buffer
    // empty rather than holding a quote that would be shown a second day.
    useEffect(() => {
        if (data && nextQuote && data.q === nextQuote.q) {
            queryClient.resetQueries({ queryKey: NEXT_QUOTE_KEY, exact: true });
        }
    }, [data, nextQuote, queryClient]);

    const quote = data ?? FALLBACK_QUOTE;

    return (
        // A plain card, not a touchable: it used to fade on a tap that did nothing.
        // PixelCard in the card's own pink ink, at the shared 4px shadow (was 6).
        <PixelCard padding={CARD_PADDING} outlineColor={INK} accentColor={ACCENT} style={styles.card}>
            <View style={styles.headerRow}>
                <Quote size={18} color={ACCENT} fill={ACCENT} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>[ DAILY INSPIRATION ]</Text>
            </View>

            {isPending ? (
                // Two quote lines and an author line, each at its real line height.
                <View>
                    <View style={styles.skeletonQuote}>
                        <SkeletonBox height={14} borderRadius={0} />
                        <SkeletonBox width="70%" height={14} borderRadius={0} />
                    </View>
                    <View style={styles.footerRow}>
                        <SkeletonBox width={90} height={12} borderRadius={0} />
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
        </PixelCard>
    );
}

// Pixel-art palette (same pinks as before)
const INK = '#831843';     // Darkest pink, used as the "ink" outline
const PAPER = '#FDF2F8';   // Pale pink card fill
const ACCENT = '#DB2777';  // Pink accent
const LABEL = '#BE185D';   // Title / author pink

const styles = StyleSheet.create({
    card: {
        backgroundColor: PAPER,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: SPACE.md,
        marginBottom: SPACE.md,
        gap: SPACE.sm,
        borderBottomWidth: 3,
        borderBottomColor: INK,
    },
    cardTitle: {
        ...TYPE.label,
        color: LABEL,
    },
    quoteText: {
        ...TYPE.bodyLg,
        color: INK,
        marginBottom: SPACE.md,
    },
    skeletonQuote: {
        // Matches quoteText: two 22pt lines and the same gap above the footer.
        gap: SPACE.sm,
        paddingVertical: SPACE.xs,
        marginBottom: SPACE.md,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: SPACE.md,
        borderTopWidth: 2,
        borderTopColor: ACCENT,
        borderStyle: 'dotted',
    },
    authorText: {
        ...TYPE.label,
        color: LABEL,
    },
});
