import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { X, SmilePlus, Edit, Sparkles, Target, Check, Minus, Clock } from 'lucide-react-native';
import EntryEmotionsList from './EntryEmotionsList';
import { TIME_OF_DAY_LABELS } from '../../constants/goals';
import type { GoalDayStatus } from '@shared/types';
import { TYPE } from '../../constants/typography';
import {
    OUTLINE, PAPER, INK, INK_MUTED, BORDER_W, BORDER_W_INNER, PRESSED, PRESS_SINK,
} from '../../constants/pixel';
import { GOAL_TEXT, DANGER_TEXT, WARNING_TEXT } from '../../constants/colors';
import { CARD_PADDING, SCREEN_GUTTER, SECTION_GAP, SPACE, hitSlopFor } from '../../constants/layout';

interface DayEntryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: string;
    entries: any[];
    greetings?: any[];
    /**
     * Goals SCHEDULED on this day, each with what became of it -- both derived, from
     * the goal's weekdays and from whether the day was marked done. Neither is a
     * stored record, which is why a day still to come has a row here at all.
     */
    goals?: { goal: any; status: GoalDayStatus }[];
    onEditEntry?: (entry: any) => void;
}

/** Matches the calendar's goal pip and the Fab's Goals action. */
const GOAL_COLOR = '#10B981';

/**
 * How each status is drawn: the label on the badge, the ink it is drawn in, and the
 * fill behind its icon.
 *
 * Four flat entries rather than a chain of conditionals at the render site, because
 * every status differs in exactly these three ways and nothing else. A tick for a
 * day kept, a dash for one that went by unmarked, a clock for one still open, and
 * the plain target for a day that hasn't arrived -- the shape says it before the
 * colour does, which is what keeps done and missed apart for a red/green eye.
 */
const GOAL_STATUS: Record<GoalDayStatus, { label: string; color: string; text: string; tint: string; Icon: typeof Target }> = {
    // `color` draws the icon and the badge outline; `text` is the badge label, the
    // same hue darkened until it reads at 4.5:1 on paper.
    done: { label: 'DONE', color: GOAL_COLOR, text: GOAL_TEXT, tint: '#D1FAE5', Icon: Check },
    missed: { label: 'MISSED', color: '#DC2626', text: DANGER_TEXT, tint: '#FEE2E2', Icon: Minus },
    pending: { label: 'PENDING', color: '#D97706', text: WARNING_TEXT, tint: '#FEF3C7', Icon: Clock },
    upcoming: { label: 'UPCOMING', color: INK_MUTED, text: INK_MUTED, tint: '#EDE9E0', Icon: Target },
};

export default function DayEntryModal({ visible, onClose, selectedDate, entries, greetings = [], goals = [], onEditEntry }: DayEntryModalProps) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>

                    {/* Header */}
                    <View style={styles.modalHeader}>
                        {/* Flexible column: long dates wrap here instead of widening the
                            row and pushing the close button past the screen edge. */}
                        <View style={styles.headerText}>
                            <Text style={styles.modalTitle}>Daily Reflection</Text>
                            <Text style={styles.modalDate} numberOfLines={2}>
                                {format(new Date(selectedDate), 'EEEE, MMMM d')}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            hitSlop={hitSlopFor(32)}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                        >
                            <X size={20} color={INK} strokeWidth={3} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.modalScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {entries.length === 0 && greetings.length === 0 && goals.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No entries for this day.</Text>
                            </View>
                        ) : (
                            <View style={styles.entryCard}>

                                {/* GREETINGS SECTION */}
                                {greetings.length > 0 && (
                                    <View style={styles.sectionContainer}>
                                        <View style={styles.sectionHeader}>
                                            <Sparkles size={18} color="#0099ffff" />
                                            <Text style={styles.sectionTitle}>GREETINGS</Text>
                                        </View>
                                        {greetings.map((greeting, index) => {
                                            const isLast = index === greetings.length - 1;
                                            return (
                                                <View key={greeting.id} style={styles.timelineItem}>
                                                    <View style={styles.timelineColumn}>
                                                        <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
                                                            <Sparkles size={20} color="#0099ffff" />
                                                        </View>
                                                        {!isLast && <View style={styles.timelineLine} />}
                                                    </View>
                                                    <View style={styles.contentColumn}>
                                                        <Text style={styles.entryTime}>
                                                            {format(new Date(greeting.createdAt), 'h:mm a')}
                                                        </Text>
                                                        <View style={styles.greetingList}>
                                                            {String(greeting.text)
                                                                .split('\n')
                                                                // Strips whichever marker the note was saved with, including the
                                                                // block characters used before the pixel font landed.
                                                                .map((line: string) => line.replace(/^[■▪◼•*]\s*/, '').trim())
                                                                .filter((line: string) => line !== '')
                                                                .map((line: string, i: number) => (
                                                                    <View key={i} style={styles.greetingRow}>
                                                                        {/* Drawn as a block rather than typed: Silkscreen has no square
                                                                            glyph, and its bullet is a single 2x2px dot, so no font size
                                                                            makes one read as a bullet. */}
                                                                        <View style={styles.greetingBullet} />
                                                                        <Text style={styles.greetingText}>{line}</Text>
                                                                    </View>
                                                                ))}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* DIVIDER IF BOTH EXIST */}
                                {greetings.length > 0 && entries.length > 0 && (
                                    <View style={styles.divider} />
                                )}

                                {/* EMOTIONS SECTION */}
                                {entries.length > 0 && (
                                    <View style={styles.sectionContainer}>
                                        <View style={styles.sectionHeader}>
                                            <SmilePlus size={18} color="#A78BFA" />
                                            <Text style={styles.sectionTitle}>EMOTIONS</Text>
                                        </View>
                                        {entries.map((entry, index) => {
                                            const emotions = entry.emotions;

                                            return (
                                                <View key={entry.id} style={styles.innerEntryContainer}>
                                                    {/* Card Header: Time & Edit */}
                                                    <View style={styles.cardHeader}>
                                                        <Text style={styles.entryTime}>
                                                            {format(new Date(entry.timestamp), 'h:mm a')}
                                                        </Text>
                                                        {/* {onEditEntry && (
                                                            <TouchableOpacity onPress={() => onEditEntry(entry)}>
                                                                <Edit size={16} color="#94A3B8" />
                                                            </TouchableOpacity>
                                                        )} */}
                                                    </View>

                                                    {/* Emotions List (Modular Component) */}
                                                    <EntryEmotionsList emotions={emotions} />


                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* DIVIDER BEFORE GOALS IF ANYTHING PRECEDES THEM */}
                                {goals.length > 0 && (greetings.length > 0 || entries.length > 0) && (
                                    <View style={styles.divider} />
                                )}

                                {/* GOALS SECTION -- what was DUE this day, which is why
                                    there is no time stamp: a goal is scheduled, not logged. */}
                                {goals.length > 0 && (
                                    <View style={styles.sectionContainer}>
                                        <View style={styles.sectionHeader}>
                                            <Target size={18} color={GOAL_COLOR} />
                                            <Text style={styles.sectionTitle}>GOALS</Text>
                                        </View>
                                        {goals.map(({ goal, status }, index) => {
                                            const isLast = index === goals.length - 1;
                                            const { label, color, text, tint, Icon } = GOAL_STATUS[status];
                                            return (
                                                <View key={goal.id} style={styles.timelineItem}>
                                                    <View style={styles.timelineColumn}>
                                                        <View style={[styles.iconWrapper, { backgroundColor: tint }]}>
                                                            <Icon size={20} color={color} strokeWidth={3} />
                                                        </View>
                                                        {!isLast && <View style={styles.timelineLine} />}
                                                    </View>
                                                    <View style={styles.contentColumn}>
                                                        {/* Badge above the name, not beside it: a long goal name and a
                                                            badge on one row would each squeeze the other, and the status
                                                            is what the eye is scanning the column for. */}
                                                        <View style={[styles.goalBadge, { borderColor: color }]}>
                                                            <Text style={[styles.goalBadgeText, { color: text }]}>{label}</Text>
                                                        </View>
                                                        <Text style={styles.goalName}>{goal.name}</Text>
                                                        <Text style={styles.goalTimes}>
                                                            {(goal.timesOfDay ?? [])
                                                                .map((time: string) => TIME_OF_DAY_LABELS[time as keyof typeof TIME_OF_DAY_LABELS] ?? time)
                                                                .join(' * ')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                            </View>
                        )}
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#F1EFE8', // Slightly off-white for the background sheet
        maxHeight: '85%',
        // Square corners and a hard top rule instead of a 24px radius over a
        // blurred shadow -- the outline is what separates the sheet from the page.
        borderTopWidth: BORDER_W,
        borderColor: OUTLINE,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md, // Keeps a long date off the close button
        paddingHorizontal: SCREEN_GUTTER,
        paddingVertical: SPACE.lg,
        backgroundColor: PAPER,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
    },
    headerText: {
        // Without this the column sizes to its text and, since flex children do not
        // shrink by default, a long date ("Wednesday, September 30") widened the row
        // and carried the close button off the right edge of the screen.
        flex: 1,
    },
    modalTitle: {
        ...TYPE.label,
        color: INK_MUTED,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: SPACE.xs,
    },
    modalDate: {
        // Silkscreen runs ~0.76em per character: at the old 24px the longest date was
        // 453px wide, against ~260px of room on a narrow phone. h3 with light
        // tracking keeps most dates to one line; the longest wrap to two.
        ...TYPE.h3,
        letterSpacing: 0.5,
    },
    closeButton: {
        flexShrink: 0, // Never squeezed or displaced by the date beside it
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    closeButtonPressed: {
        transform: [{ translateX: PRESS_SINK }, { translateY: PRESS_SINK }],
        backgroundColor: PRESSED,
    },
    modalScroll: {
        // flex: 1, // Removed to allow auto-height behavior within maxHeight container
    },
    scrollContent: {
        paddingHorizontal: SCREEN_GUTTER,
        paddingTop: SCREEN_GUTTER,
    },
    emptyContainer: {
        paddingVertical: SPACE.xxl,
        alignItems: 'center',
    },
    emptyText: {
        ...TYPE.body,
        color: INK, // INK_MUTED on this sheet was 4.1:1
    },

    // Entry Card
    entryCard: {
        backgroundColor: PAPER,
        padding: CARD_PADDING,
        marginBottom: SECTION_GAP,
        // Outline only, no offset shadow: the card runs the full width of a sheet
        // that already has its own hard edge, so a second one would just crowd it.
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
    },
    innerEntryContainer: {
        marginBottom: SECTION_GAP,
    },
    divider: {
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
        marginVertical: SPACE.lg,
    },
    sectionContainer: {
        marginBottom: SPACE.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.sm,
        paddingBottom: SPACE.md,
        marginBottom: SPACE.sm,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    sectionTitle: {
        ...TYPE.label,
        letterSpacing: 2,
        // Ink, not the section hue: the sky blue, violet and green read at 2.5-3:1
        // as text. The icon beside the title still carries the colour.
        color: INK,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: SPACE.xs,
    },
    timelineColumn: {
        width: 48,
        alignItems: 'center',
        marginRight: SPACE.md,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        zIndex: 2,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: OUTLINE,
        marginVertical: SPACE.xs,
    },
    contentColumn: {
        flex: 1,
        paddingTop: SPACE.sm,
        paddingBottom: SPACE.xl,
    },
    greetingList: {
        marginTop: SPACE.xs,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACE.xs,
    },
    greetingBullet: {
        width: 8,
        height: 8,
        backgroundColor: '#0099ffff',
        marginRight: SPACE.sm,
        // Centres the block on the cap height of the first 22px line of text
        // (baseline sits 3.75px up, caps reach 10.5px above that).
        marginTop: 9,
    },
    greetingText: {
        ...TYPE.bodyLg,
        flex: 1,
        color: '#334155',
        // No italic: Silkscreen ships one upright face per weight, so RN fakes the
        // slant by shearing the bitmap, which tears the pixel grid.
    },
    goalBadge: {
        // alignSelf so the box hugs its label instead of stretching the column.
        alignSelf: 'flex-start',
        paddingHorizontal: SPACE.xs,
        marginBottom: SPACE.xs,
        borderWidth: BORDER_W_INNER,
        // borderColor and text colour are set inline, per status.
    },
    goalBadgeText: {
        ...TYPE.label,
    },
    goalName: {
        ...TYPE.label,
        letterSpacing: 0.5,
    },
    goalTimes: {
        ...TYPE.label,
        marginTop: SPACE.xs,
        color: INK_MUTED,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACE.sm,
    },
    entryTime: {
        ...TYPE.label,
        color: INK_MUTED,
    },

    bottomSpacer: {
        height: SPACE.xxl,
    }
});
