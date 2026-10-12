import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, PixelCard, ToggleBox } from '../components';
import { TIP_CATEGORIES, TIP_LEVELS, TipCategory, TipLevel, byLevel, getTipOfTheDay } from '../constants/tips';
import {
    CARD_PADDING, HEADING_GAP, ROW_PADDING_H, ROW_PADDING_V, SCREEN_BOTTOM, SCREEN_GUTTER,
    SCREEN_TOP, SECTION_GAP, SPACE, hitSlopFor,
} from '../constants/layout';
import { TYPE } from '../constants/typography';
import { OUTLINE, PAPER, BORDER_W_INNER } from '../constants/pixel';

const ALL = 'all';

/** Filter chip height, and the vertical slop that takes it to MIN_TOUCH. */
const CHIP_H = 34;
const CHIP_SLOP = { top: hitSlopFor(CHIP_H), bottom: hitSlopFor(CHIP_H) };

/** Difficulty tag: one to three filled pips and the level's name. */
const LevelBadge = ({ level }: { level: TipLevel }) => {
    const { label, rank, color, tint } = TIP_LEVELS[level];

    return (
        <View
            style={[styles.levelBadge, { backgroundColor: tint, borderColor: color }]}
            accessible
            accessibilityLabel={`Difficulty: ${label.toLowerCase()}`}
        >
            <View style={styles.pips}>
                {[1, 2, 3].map(pip => (
                    <View
                        key={pip}
                        style={[styles.pip, { borderColor: color }, pip <= rank && { backgroundColor: color }]}
                    />
                ))}
            </View>
            <Text style={[styles.levelText, { color }]}>{label}</Text>
        </View>
    );
};

/** One category: a tinted header band, then its tips easy → hard on the same card. */
const CategoryCard = ({ category }: { category: TipCategory }) => {
    const Icon = category.icon;
    const tips = [...category.tips].sort(byLevel);

    return (
        <PixelCard padding={0} accentColor={category.color} wrapperStyle={styles.categoryCardWrapper}>
            <View style={[styles.categoryHeader, { backgroundColor: category.tint }]}>
                <View style={styles.iconBox}>
                    <Icon size={18} color={category.color} strokeWidth={2.5} />
                </View>
                <Text style={[styles.categoryTitle, { color: category.color }]} accessibilityRole="header">
                    {category.title}
                </Text>
            </View>

            {tips.map((tip, index) => (
                <View
                    key={tip.title}
                    style={[styles.tip, index < tips.length - 1 && styles.tipDivided]}
                >
                    <LevelBadge level={tip.level} />
                    <Text style={styles.tipTitle}>{tip.title.toUpperCase()}</Text>
                    <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
            ))}
        </PixelCard>
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
                            <LevelBadge level={tipOfTheDay.tip.level} />
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
    categoryCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md,
        paddingVertical: SPACE.md,
        paddingHorizontal: ROW_PADDING_H,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
    },
    iconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    categoryTitle: {
        ...TYPE.h3,
        flex: 1,
        letterSpacing: 1.5,
    },
    tip: {
        paddingVertical: ROW_PADDING_V + SPACE.xs,
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

    // --- Difficulty badge ---
    levelBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
        paddingVertical: 2,
        paddingHorizontal: SPACE.sm,
        borderWidth: BORDER_W_INNER,
        marginBottom: SPACE.sm,
    },
    pips: {
        flexDirection: 'row',
        gap: 2,
    },
    pip: {
        width: 6,
        height: 6,
        borderWidth: 1,
    },
    levelText: {
        ...TYPE.label,
    },
});
