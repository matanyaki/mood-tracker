import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { format } from 'date-fns';
import { X, SmilePlus, Edit, Sparkles } from 'lucide-react-native';
import EntryEmotionsList from './EntryEmotionsList';

interface DayEntryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: string;
    entries: any[];
    greetings?: any[];
    onEditEntry?: (entry: any) => void;
}

export default function DayEntryModal({ visible, onClose, selectedDate, entries, greetings = [], onEditEntry }: DayEntryModalProps) {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Daily Reflection</Text>
                            <Text style={styles.modalDate}>
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
                                                        <Text style={styles.greetingText}>"{greeting.text}"</Text>
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
                                            const emotions = entry.emotions && entry.emotions.length > 0
                                                ? entry.emotions
                                                : (entry.emotion ? [{
                                                    id: entry.emotion.toLowerCase(),
                                                    label: entry.emotion,
                                                    scale: entry.scale,
                                                    note: entry.note
                                                }] : []);

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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalDate: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
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
        fontWeight: '700',
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
    greetingText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
        fontStyle: 'italic',
        marginTop: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTime: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },



    bottomSpacer: {
        height: 40,
    }
});
