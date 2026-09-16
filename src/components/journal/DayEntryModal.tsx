import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { X, SmilePlus, Edit, Sparkles, Target, Check, Minus, Clock } from 'lucide-react-native';
import EntryEmotionsList from './EntryEmotionsList';
import { TIME_OF_DAY_LABELS } from '../../constants/goals';
import type { GoalDayStatus } from '@shared/types';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W, BORDER_W_INNER } from '../../constants/pixel';

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
const GOAL_STATUS: Record<GoalDayStatus, { label: string; color: string; tint: string; Icon: typeof Target }> = {
    done: { label: 'DONE', color: GOAL_COLOR, tint: '#D1FAE5', Icon: Check },
    missed: { label: 'MISSED', color: '#DC2626', tint: '#FEE2E2', Icon: Minus },
    pending: { label: 'PENDING', color: '#D97706', tint: '#FEF3C7', Icon: Clock },
    upcoming: { label: 'UPCOMING', color: INK_MUTED, tint: '#EDE9E0', Icon: Target },
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
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={INK} strokeWidth={3} />
                        </TouchableOpacity>
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
                                            <Text style={[styles.sectionTitle, { color: '#0099ffff' }]}>GREETINGS</Text>
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
                                            <Text style={[styles.sectionTitle, { color: '#A78BFA' }]}>EMOTIONS</Text>
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
                                            <Text style={[styles.sectionTitle, { color: GOAL_COLOR }]}>GOALS</Text>
                                        </View>
                                        {goals.map(({ goal, status }, index) => {
                                            const isLast = index === goals.length - 1;
                                            const { label, color, tint, Icon } = GOAL_STATUS[status];
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
                                                            <Text style={[styles.goalBadgeText, { color }]}>{label}</Text>
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
        gap: 12, // Keeps a long date off the close button
        padding: 20,
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
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    modalDate: {
        // Silkscreen runs ~0.76em per character: at the old 24px the longest date was
        // 453px wide, against ~260px of room on a narrow phone.
        fontSize: 16,
        lineHeight: 22,
        fontFamily: PIXEL_BOLD,
        color: INK,
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
    modalScroll: {
        // flex: 1, // Removed to allow auto-height behavior within maxHeight container
    },
    scrollContent: {
        padding: 20,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: INK_MUTED,
        fontSize: 13,
        fontFamily: PIXEL,
        letterSpacing: 1,
    },

    // Entry Card
    entryCard: {
        backgroundColor: PAPER,
        padding: 18,
        marginBottom: 24,
        // Outline only, no offset shadow: the card runs the full width of a sheet
        // that already has its own hard edge, so a second one would just crowd it.
        borderWidth: BORDER_W,
        borderColor: OUTLINE,
    },
    innerEntryContainer: {
        marginBottom: 24,
    },
    divider: {
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
        marginVertical: 16,
    },
    sectionContainer: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 12,
        marginBottom: 8,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timelineColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 12,
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
        marginVertical: 4,
    },
    contentColumn: {
        flex: 1,
        paddingTop: 8,
        paddingBottom: 24,
    },
    greetingList: {
        marginTop: 6,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    greetingBullet: {
        width: 8,
        height: 8,
        backgroundColor: '#0099ffff',
        marginRight: 10,
        // Centres the block on the cap height of the first 22px line of text
        // (baseline sits 3.75px up, caps reach 10.5px above that).
        marginTop: 9,
    },
    greetingText: {
        flex: 1,
        fontSize: 13,
        fontFamily: PIXEL,
        color: '#334155',
        lineHeight: 22,
        // No italic: Silkscreen ships one upright face per weight, so RN fakes the
        // slant by shearing the bitmap, which tears the pixel grid.
    },
    goalBadge: {
        // alignSelf so the box hugs its label instead of stretching the column.
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginBottom: 6,
        borderWidth: BORDER_W_INNER,
        // borderColor and text colour are set inline, per status.
    },
    goalBadgeText: {
        fontSize: 9,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 1,
    },
    goalName: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        lineHeight: 20,
    },
    goalTimes: {
        marginTop: 6,
        fontSize: 10,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTime: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK_MUTED,
        letterSpacing: 1,
    },



    bottomSpacer: {
        height: 40,
    }
});
