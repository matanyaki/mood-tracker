import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, PixelCard, ToggleBox } from '../components';
import { TIP_CATEGORIES, TipCategory, getTipOfTheDay } from '../constants/tips';
import {
    CARD_PADDING, HEADING_GAP, ROW_PADDING_H, ROW_PADDING_V, SCREEN_BOTTOM, SCREEN_GUTTER,
    SCREEN_TOP, SECTION_GAP, SPACE, hitSlopFor,
} from '../constants/layout';
import { TYPE } from '../constants/typography';
import { OUTLINE, BORDER_W_INNER } from '../constants/pixel';

const ALL = 'all';

/** Filter chip height, and the vertical slop that takes it to MIN_TOUCH. */
const CHIP_H = 34;
const CHIP_SLOP = { top: hitSlopFor(CHIP_H), bottom: hitSlopFor(CHIP_H) };

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
    const insets = useSafeAreaInsets();

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
                leftAction={<BackButton onPress={() => navigation.goBack()} />}
            />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <PixelCard
                    padding={CARD_PADDING}
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
                        hitSlop={CHIP_SLOP}
                        accessibilityRole="radio"
                    />
                    {TIP_CATEGORIES.map(category => (
                        <ToggleBox
                            key={category.id}
                            label={category.title}
                            selected={filter === category.id}
                            onPress={() => setFilter(category.id)}
                            style={styles.filterChip}
                            hitSlop={CHIP_SLOP}
                            accessibilityRole="radio"
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
    content: {
        paddingHorizontal: SCREEN_GUTTER,
        paddingTop: SCREEN_TOP,
    },

    // --- Tip of the day ---
    featuredCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    featuredCard: {
        backgroundColor: '#FFFBEB',
    },
    featuredEyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.xs,
        marginBottom: SPACE.md,
    },
    featuredEyebrow: {
        ...TYPE.label,
        color: '#A16207',
        letterSpacing: 2,
    },
    featuredRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACE.md,
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
        ...TYPE.label,
        marginBottom: SPACE.xs,
    },
    featuredBody: {
        ...TYPE.body,
    },

    // --- Filter ---
    filterScroll: {
        marginHorizontal: -SCREEN_GUTTER,
        marginTop: -CHIP_SLOP.top,
        marginBottom: SECTION_GAP - CHIP_SLOP.bottom,
    },
    filterRow: {
        paddingHorizontal: SCREEN_GUTTER,
        // Room inside the scroll view for the chips' hitSlop -- Android drops touches
        // outside a parent's bounds -- given back by filterScroll's negative margin.
        paddingVertical: CHIP_SLOP.top,
        gap: SPACE.sm,
    },
    filterChip: {
        // The goal form's boxes are 44 tall to be easy day targets; a filter row
        // that scrolls sideways reads better slimmer. CHIP_SLOP makes up the
        // difference to the touch target, and minHeight lets a large font grow it.
        minHeight: CHIP_H,
        paddingHorizontal: SPACE.md,
    },

    // --- Categories ---
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
        marginBottom: HEADING_GAP,
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
        ...TYPE.label,
        flex: 1,
        letterSpacing: 1.5,
    },
    categoryCount: {
        ...TYPE.label,
        color: TYPE.caption.color,
    },
    categoryCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    tip: {
        paddingVertical: ROW_PADDING_V,
        paddingHorizontal: ROW_PADDING_H,
    },
    tipDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    tipTitle: {
        ...TYPE.label,
        marginBottom: SPACE.xs,
    },
    tipBody: {
        ...TYPE.body,
    },

    footnote: {
        ...TYPE.caption,
        textAlign: 'center',
        paddingHorizontal: SPACE.md,
    },
});
