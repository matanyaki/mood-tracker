import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Quote, ExternalLink } from 'lucide-react-native';

interface ZenQuote {
    q: string; // Quote
    a: string; // Author
    h: string; // HTML format (unused)
}

export default function QuoteCard() {
    const [quote, setQuote] = useState<string | null>(null);
    const [author, setAuthor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchQuote();
    }, []);

    const fetchQuote = async () => {
        try {
            setLoading(true);
            setError(false);
            // ZenQuotes API: https://zenquotes.io/api/today
            // Note: Since this is a public API without a key, it can be strict on rate limits
            // or require CORS proxy if run in browser. In React Native directly, it usually works fine.
            const response = await fetch('https://zenquotes.io/api/today');

            if (!response.ok) throw new Error('Failed to fetch quote');

            const data: ZenQuote[] = await response.json();

            if (data && data.length > 0) {
                setQuote(data[0].q);
                setAuthor(data[0].a);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('[QuoteCard] Error fetching quote:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = () => {
        // Optional: Open ZenQuotes or search the author
        // Linking.openURL('https://zenquotes.io/');
    };

    if (loading) {
        return (
            <View style={[styles.card, styles.loadingContainer]}>
                <ActivityIndicator color="#BE185D" />
            </View>
        );
    }

    if (error || !quote) {
        // Fallback static quote if API fails
        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Quote size={20} color="#BE185D" fill="#BE185D" />
                    <Text style={styles.cardTitle}>Daily Quote</Text>
                </View>
                <Text style={styles.quoteText}>
                    "The only way to do great work is to love what you do."
                </Text>
                <Text style={styles.authorText}>- Steve Jobs</Text>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={handlePress}
        >
            <View style={styles.headerRow}>
                <Quote size={20} color="#BE185D" fill="#BE185D" />
                <Text style={styles.cardTitle}>Daily Inspiration</Text>
            </View>

            <Text style={styles.quoteText}>"{quote}"</Text>

            <View style={styles.footerRow}>
                <Text style={styles.authorText}>- {author}</Text>
                {/* <ExternalLink size={14} color="#BE185D" opacity={0.5} /> */}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FDF2F8', // Pink-50
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#DB2777', // Pink-600
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    loadingContainer: {
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#BE185D', // Pink-700
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quoteText: {
        fontSize: 18,
        color: '#831843', // Pink-900
        lineHeight: 28,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 6,
    },
    authorText: {
        fontSize: 14,
        color: '#BE185D', // Pink-700
        fontWeight: '500',
    },
});
