import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, HeartHandshake, ExternalLink } from 'lucide-react-native';
import { ScreenContainer, AppHeader, PixelCard } from '../components';
import { PixelAlert } from '../components/ui/PixelAlert';
import { HELP_SECTIONS, CRISIS_SUPPORT, HelpItem } from '../constants/help';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

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
                {/* First, not last: someone who opened Help on a bad day shouldn't
                    have to scroll past how streaks work to find this. */}
                <PixelCard
                    padding={16}
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

    // --- Crisis card ---
    crisisCardWrapper: {
        marginBottom: 24,
    },
    crisisCard: {
        // Soft rose paper, so it reads as set apart without shouting.
        backgroundColor: '#FFF1F2',
    },
    crisisRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
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
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: '#9F1239',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    crisisBody: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: '#9F1239',
        lineHeight: 18,
    },
    crisisLink: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    crisisLinkPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
        backgroundColor: '#FFE4E6',
    },
    crisisLinkText: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: ROSE,
        letterSpacing: 1,
    },

    // --- Questions ---
    sectionTitle: {
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 2,
        marginBottom: 10,
    },
    sectionCardWrapper: {
        marginBottom: 24,
    },
    rowDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    questionRowPressed: {
        backgroundColor: '#EDE9E0',
    },
    question: {
        flex: 1,
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
        lineHeight: 16,
    },
    questionOpen: {
        color: CYAN,
    },
    answer: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        lineHeight: 18,
        paddingHorizontal: 14,
        paddingBottom: 14,
        marginTop: -4,
    },
});
