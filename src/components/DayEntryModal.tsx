import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { X, SmilePlus, Edit, Sparkles } from 'lucide-react-native';
import EntryEmotionsList from './EntryEmotionsList';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';

interface DayEntryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: string;
    entries: any[];
    greetings?: any[];
    onEditEntry?: (entry: any) => void;
}

export default function DayEntryModal({ visible, onClose, selectedDate, entries, greetings = [], onEditEntry }: DayEntryModalProps) {
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
                            <X size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {entries.length === 0 && greetings.length === 0 ? (
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
        backgroundColor: '#F8FAFC', // Slightly off-white for the background sheet
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Keeps a long date off the close button
        padding: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    modalDate: {
        // Silkscreen runs ~0.76em per character: at the old 24px the longest date was
        // 453px wide, against ~260px of room on a narrow phone.
        fontSize: 16,
        lineHeight: 22,
        fontFamily: PIXEL_BOLD,
        color: '#0F172A',
    },
    closeButton: {
        flexShrink: 0, // Never squeezed or displaced by the date beside it
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
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
        color: '#94A3B8',
        fontSize: 16,
        fontFamily: PIXEL,
    },

    // Entry Card
    entryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    innerEntryContainer: {
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    sectionContainer: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        letterSpacing: 0.5,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#E2E8F0',
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
        fontSize: 15,
        fontFamily: PIXEL,
        color: '#334155',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTime: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: '#94A3B8',
    },



    bottomSpacer: {
        height: 40,
    }
});
