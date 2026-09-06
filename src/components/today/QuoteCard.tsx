import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from 'lucide-react-native';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';

interface ZenQuote {
    q: string; // Quote
    a: string; // Author
}

const STORAGE_KEY = '@mindbright_daily_quote';
const FALLBACK_QUOTE = {
    q: "The only way to do great work is to love what you do.",
    a: "Steve Jobs"
};

export default function QuoteCard() {
    const [quote, setQuote] = useState<string>(FALLBACK_QUOTE.q);
    const [author, setAuthor] = useState<string>(FALLBACK_QUOTE.a);

    useEffect(() => {
        loadCachedQuoteAndRevalidate();
    }, []);

    const loadCachedQuoteAndRevalidate = async () => {
        try {
            // 1. Get cached data instantly
            const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData) as ZenQuote;
                setQuote(parsed.q);
                setAuthor(parsed.a);
            }

            // 2. Revalidate silently in the background
            // Added a short timeout constraint so slow networks don't hang indefinitely
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch('https://zenquotes.io/api/today', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) return; // Fail silently, keep showing the cached version

            const data: ZenQuote[] = await response.json();

            if (data && data.length > 0) {
                const newQuote = data[0].q;
                const newAuthor = data[0].a;

                // 3. Update state only if it's actually a new quote
                if (newQuote !== quote) {
                    setQuote(newQuote);
                    setAuthor(newAuthor);

                    // 4. Cache it for the next app session
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ q: newQuote, a: newAuthor }));
                }
            }
        } catch (err) {
            // Log natively, but don't disrupt the user since they have a cached/fallback quote visible
            console.log('[QuoteCard] Background revalidation bypassed:', err);
        }
    };

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

                <Text style={styles.quoteText}>"{quote}"</Text>

                <View style={styles.footerRow}>
                    <Text style={styles.authorText}>- {author}</Text>
                </View>
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
        position: 'relative',
        marginBottom: 16,
        marginRight: 6, // Room for the offset pixel shadow
    },
    pixelShadow: {
        ...StyleSheet.absoluteFill,
        backgroundColor: INK,
        transform: [{ translateX: 6 }, { translateY: 6 }],
    },
    card: {
        backgroundColor: PAPER,
        padding: 18,
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
