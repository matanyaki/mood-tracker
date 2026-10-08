import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, HeartHandshake, ExternalLink } from 'lucide-react-native';
import { ScreenContainer, AppHeader, BackButton, PixelCard } from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { HELP_SECTIONS, CRISIS_SUPPORT, HelpItem } from '../constants/help';
import { TYPE } from '../constants/typography';
import {
    CARD_PADDING, HEADING_GAP, ROW_PADDING_H, ROW_PADDING_V, SCREEN_BOTTOM, SCREEN_GUTTER,
    SCREEN_TOP, SECTION_GAP, SPACE, hitSlopFor,
} from '../constants/layout';
import { OUTLINE, PAPER, INK_MUTED, BORDER_W_INNER, PRESSED, PRESS_SINK } from '../constants/pixel';

const CYAN = '#0E7490';
const ROSE = '#BE123C';

/**
 * One question. Tapping it opens the answer underneath; several can be open at once,
 * so a user comparing two answers doesn't lose the first.
 */
const HelpRow = ({ item, isOpen, onToggle, isLast }: {
    item: HelpItem;
    isOpen: boolean;
    onToggle: () => void;
    isLast: boolean;
}) => {
    const Chevron = isOpen ? ChevronUp : ChevronDown;

    return (
        <View style={!isLast && styles.rowDivided}>
            <Pressable
                onPress={onToggle}
                style={({ pressed }) => [styles.questionRow, pressed && styles.questionRowPressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
            >
                <Text style={[styles.question, isOpen && styles.questionOpen]}>
                    {item.question.toUpperCase()}
                </Text>
                <Chevron size={16} color={isOpen ? CYAN : INK_MUTED} strokeWidth={3} />
            </Pressable>

            {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
        </View>
    );
};

/**
 * How the app works, as questions grouped by area, with where to find support
 * at the top. The copy lives in constants/help.ts.
 */
export default function HelpScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    // Keyed "section:question" -- question text alone could repeat across sections.
    const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

    const toggle = useCallback((key: string) => {
        setOpenKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const openHelpline = useCallback(async () => {
        try {
            await Linking.openURL(CRISIS_SUPPORT.url);
        } catch {
            PixelAlert.alert("Couldn't open the link", `Visit ${CRISIS_SUPPORT.url} in your browser.`);
        }
    }, []);

    return (
        <ScreenContainer variant="calm">
            <AppHeader
                title="Help"
                leftAction={<BackButton onPress={() => navigation.goBack()} />}
            />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: SCREEN_BOTTOM + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* First, not last: someone who opened Help on a bad day shouldn't
                    have to scroll past how streaks work to find this. */}
                <PixelCard
                    padding={CARD_PADDING}
                    accentColor={ROSE}
                    style={styles.crisisCard}
                    wrapperStyle={styles.crisisCardWrapper}
                >
                    <View style={styles.crisisRow}>
                        <View style={styles.crisisIconBox}>
                            <HeartHandshake size={18} color={ROSE} strokeWidth={2.5} />
                        </View>
                        <View style={styles.crisisText}>
                            <Text style={styles.crisisTitle}>{CRISIS_SUPPORT.title}</Text>
                            <Text style={styles.crisisBody}>{CRISIS_SUPPORT.body}</Text>
                            <Pressable
                                onPress={openHelpline}
                                // The tag is 24px tall (16 line + 2x4 padding + 2x2 border); the slop takes it to 44.
                                hitSlop={{ top: hitSlopFor(24), bottom: hitSlopFor(24) }}
                                style={({ pressed }) => [styles.crisisLink, pressed && styles.crisisLinkPressed]}
                                accessibilityRole="link"
                            >
                                <Text style={styles.crisisLinkText}>{CRISIS_SUPPORT.linkLabel}</Text>
                                <ExternalLink size={12} color={ROSE} strokeWidth={3} />
                            </Pressable>
                        </View>
                    </View>
                </PixelCard>

                {HELP_SECTIONS.map(section => (
                    <View key={section.title}>
                        <Text style={styles.sectionTitle}>[ {section.title} ]</Text>
                        <PixelCard padding={0} wrapperStyle={styles.sectionCardWrapper}>
                            {section.items.map((item, index) => {
                                const key = `${section.title}:${item.question}`;
                                return (
                                    <HelpRow
                                        key={key}
                                        item={item}
                                        isOpen={openKeys.has(key)}
                                        onToggle={() => toggle(key)}
                                        isLast={index === section.items.length - 1}
                                    />
                                );
                            })}
                        </PixelCard>
                    </View>
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

    // --- Crisis card ---
    crisisCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    crisisCard: {
        // Soft rose paper, so it reads as set apart without shouting.
        backgroundColor: '#FFF1F2',
    },
    crisisRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACE.md,
    },
    crisisIconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFE4E6',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    crisisText: {
        flex: 1,
    },
    crisisTitle: {
        ...TYPE.label,
        color: '#9F1239',
        letterSpacing: 1.5,
        marginBottom: SPACE.xs,
    },
    crisisBody: {
        ...TYPE.body,
        color: '#9F1239',
    },
    crisisLink: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: SPACE.xs,
        marginTop: SPACE.md,
        paddingHorizontal: SPACE.sm,
        paddingVertical: SPACE.xs,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    crisisLinkPressed: {
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
        backgroundColor: '#FFE4E6',
    },
    crisisLinkText: {
        ...TYPE.label,
        color: ROSE,
    },

    // --- Questions ---
    sectionTitle: {
        ...TYPE.h2,
        marginBottom: HEADING_GAP,
    },
    sectionCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    rowDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md,
        paddingVertical: ROW_PADDING_V,
        paddingHorizontal: ROW_PADDING_H,
    },
    questionRowPressed: {
        backgroundColor: PRESSED,
    },
    question: {
        ...TYPE.label,
        flex: 1,
    },
    questionOpen: {
        color: CYAN,
    },
    answer: {
        ...TYPE.body,
        paddingHorizontal: ROW_PADDING_H,
        paddingBottom: ROW_PADDING_V,
    },
});
