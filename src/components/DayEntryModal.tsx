import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { format } from 'date-fns';
import { X, Edit, Sparkles } from 'lucide-react-native';
import EntryEmotionsList from './EntryEmotionsList';

interface DayEntryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: string;
    entries: any[];
    onEditEntry?: (entry: any) => void;
}

export default function DayEntryModal({ visible, onClose, selectedDate, entries, onEditEntry }: DayEntryModalProps) {
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
                        {entries.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No entries for this day.</Text>
                            </View>
                        ) : (
                            entries.map((entry) => {
                                const emotions = entry.emotions && entry.emotions.length > 0
                                    ? entry.emotions
                                    : (entry.emotion ? [{
                                        id: entry.emotion.toLowerCase(),
                                        label: entry.emotion,
                                        scale: entry.scale,
                                        note: entry.note
                                    }] : []);

                                return (
                                    <View key={entry.id} style={styles.entryCard}>

                                        {/* Card Header: Time & Edit */}
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.entryTime}>
                                                {format(new Date(entry.timestamp), 'h:mm a')}
                                            </Text>
                                            {onEditEntry && (
                                                <TouchableOpacity onPress={() => onEditEntry(entry)}>
                                                    <Edit size={16} color="#94A3B8" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Emotions List (Modular Component) */}
                                        <EntryEmotionsList emotions={emotions} />

                                        {/* AI Insight Footer */}
                                        {entry.aiFeedback && (
                                            <View style={styles.aiContainer}>
                                                <View style={styles.aiHeader}>
                                                    <Sparkles size={14} color="#3B82F6" fill="#3B82F6" />
                                                    <Text style={styles.aiTitle}>AI Insight</Text>
                                                </View>
                                                <Text style={styles.aiText}>{entry.aiFeedback}</Text>
                                            </View>
                                        )}

                                    </View>
                                );
                            })
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    entryTime: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },

    // AI Container
    aiContainer: {
        marginTop: 8,
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    aiTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284C7',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    aiText: {
        fontSize: 14,
        color: '#0369A1',
        lineHeight: 22,
    },

    bottomSpacer: {
        height: 40,
    }
});
