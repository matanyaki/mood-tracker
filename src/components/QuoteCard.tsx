import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from 'lucide-react-native';

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
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
        >
            <View style={styles.headerRow}>
                <Quote size={20} color="#BE185D" fill="#BE185D" />
                <Text style={styles.cardTitle}>Daily Inspiration</Text>
            </View>

            <Text style={styles.quoteText}>"{quote}"</Text>

            <View style={styles.footerRow}>
                <Text style={styles.authorText}>- {author}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FDF2F8',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#DB2777',
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#BE185D',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quoteText: {
        fontSize: 18,
        color: '#831843',
        lineHeight: 28,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    authorText: {
        fontSize: 14,
        color: '#BE185D',
        fontWeight: '500',
    },
});