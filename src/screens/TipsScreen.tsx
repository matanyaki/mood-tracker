import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { ScreenContainer, AppHeader, PixelCard, ToggleBox } from '../components';
import { TIP_CATEGORIES, TipCategory, getTipOfTheDay } from '../constants/tips';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

const ALL = 'all';

/** One category: its header, then every tip in it on one card. */
const CategoryCard = ({ category }: { category: TipCategory }) => {
    const Icon = category.icon;

    return (
        <View>
            <View style={styles.categoryHeader}>
                <View style={[styles.iconBox, { backgroundColor: category.tint }]}>
                    <Icon size={16} color={category.color} strokeWidth={2.5} />
                </View>
                <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                <Text style={styles.categoryCount}>{category.tips.length}</Text>
            </View>

            <PixelCard padding={0} accentColor={category.color} wrapperStyle={styles.categoryCardWrapper}>
                {category.tips.map((tip, index) => (
                    <View
                        key={tip.title}
                        style={[styles.tip, index < category.tips.length - 1 && styles.tipDivided]}
                    >
                        <Text style={styles.tipTitle}>{tip.title.toUpperCase()}</Text>
                        <Text style={styles.tipBody}>{tip.body}</Text>
                    </View>
                ))}
            </PixelCard>
        </View>
    );
};

/**
 * Small, everyday habits for the wellness journey: one featured tip for today, then
 * every tip by category, with a filter row to narrow it down. The tips live in
 * constants/tips.ts.
 */
export default function TipsScreen({ navigation }: any) {
    const [filter, setFilter] = useState<string>(ALL);

    // Fixed for the life of the screen: re-picking on every render would swap the
    // tip out from under someone who stayed past midnight.
    const tipOfTheDay = useMemo(() => getTipOfTheDay(), []);
    const FeaturedIcon = tipOfTheDay.category.icon;

    const visible = filter === ALL
        ? TIP_CATEGORIES
        : TIP_CATEGORIES.filter(category => category.id === filter);

    return (
        <ScreenContainer variant="calm">
            <AppHeader
                title="Tips"
                titleStyle={styles.headerTitle}
                leftAction={
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                        hitSlop={8}
                    >
                        <ArrowLeft color={INK} size={20} strokeWidth={2.5} />
                    </Pressable>
                }
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <PixelCard
                    padding={16}
                    accentColor={tipOfTheDay.category.color}
                    style={styles.featuredCard}
                    wrapperStyle={styles.featuredCardWrapper}
                >
                    <View style={styles.featuredEyebrowRow}>
                        <Sparkles size={12} color="#A16207" strokeWidth={3} />
                        <Text style={styles.featuredEyebrow}>TIP OF THE DAY</Text>
                    </View>

                    <View style={styles.featuredRow}>
                        <View style={[styles.featuredIconBox, { backgroundColor: tipOfTheDay.category.tint }]}>
                            <FeaturedIcon size={20} color={tipOfTheDay.category.color} strokeWidth={2.5} />
                        </View>
                        <View style={styles.featuredText}>
                            <Text style={styles.featuredTitle}>{tipOfTheDay.tip.title.toUpperCase()}</Text>
                            <Text style={styles.featuredBody}>{tipOfTheDay.tip.body}</Text>
                        </View>
                    </View>
                </PixelCard>

                {/* Bleeds to the screen edges so the row visibly scrolls rather than
                    looking clipped at the gutter. */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterRow}
                >
                    <ToggleBox
                        label="ALL"
                        selected={filter === ALL}
                        onPress={() => setFilter(ALL)}
                        style={styles.filterChip}
                    />
                    {TIP_CATEGORIES.map(category => (
                        <ToggleBox
                            key={category.id}
                            label={category.title}
                            selected={filter === category.id}
                            onPress={() => setFilter(category.id)}
                            style={styles.filterChip}
                        />
                    ))}
                </ScrollView>

                {visible.map(category => (
                    <CategoryCard key={category.id} category={category} />
                ))}

                <Text style={styles.footnote}>
                    These are everyday habits, not medical advice. Pick one that feels doable and start small.
                </Text>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        letterSpacing: 2,
        color: INK,
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    backButtonPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#EDE9E0',
    },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },

    // --- Tip of the day ---
    featuredCardWrapper: {
        marginBottom: 20,
    },
    featuredCard: {
        backgroundColor: '#FFFBEB',
    },
    featuredEyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    featuredEyebrow: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: '#A16207',
        letterSpacing: 2,
    },
    featuredRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featuredIconBox: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    featuredText: {
        flex: 1,
    },
    featuredTitle: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
        lineHeight: 18,
        marginBottom: 6,
    },
    featuredBody: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 18,
    },

    // --- Filter ---
    filterScroll: {
        marginHorizontal: -20,
        marginBottom: 20,
    },
    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        // The goal form's boxes are 44 tall to be easy day targets; a filter row
        // that scrolls sideways reads better slimmer.
        height: 34,
        paddingHorizontal: 12,
    },

    // --- Categories ---
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    iconBox: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    categoryTitle: {
        flex: 1,
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1.5,
    },
    categoryCount: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    categoryCardWrapper: {
        marginBottom: 24,
    },
    tip: {
        padding: 14,
    },
    tipDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    tipTitle: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
        lineHeight: 16,
        marginBottom: 6,
    },
    tipBody: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 18,
    },

    footnote: {
        textAlign: 'center',
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 16,
        paddingHorizontal: 12,
    },
});
