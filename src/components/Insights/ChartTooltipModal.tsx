import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { EMOTIONS_CONFIG } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';

const screenWidth = Dimensions.get('window').width;

export interface TooltipData {
    day: number;
    x?: number;
    y?: number;
    emotions: { emotionKey: string; emotion: string; scale: number; note: string }[];
}

interface ChartTooltipModalProps {
    visible: boolean;
    data: TooltipData | null;
    onClose: () => void;
}

export default function ChartTooltipModal({ visible, data, onClose }: ChartTooltipModalProps) {
    if (!data) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Day {data.day}</Text>
                        <Text style={styles.modalSubtitle}>Intensity Breakdown</Text>
                    </View>
                    
                    <View style={styles.modalBody}>
                        {data.emotions.sort((a, b) => b.scale - a.scale).map((eItem, idx) => {
                            const emotionColor = getEmotionColor(eItem.emotionKey);
                            return (
                                <View key={idx} style={styles.emotionItem}>
                                    <View style={styles.emotionRow}>
                                        <Text style={[styles.emotionName, { color: emotionColor }]}>{eItem.emotion}</Text>
                                        <Text style={styles.scaleText}>{eItem.scale}/5</Text>
                                    </View>
                                    
                                    {/* Tiny inline bars for at-a-glance comparison */}
                                    <View style={styles.barContainer}>
                                        <View style={[styles.barFill, { width: `${(eItem.scale / 5) * 100}%`, backgroundColor: emotionColor }]} />
                                    </View>
                                    
                                    {eItem.note ? (
                                        <Text style={styles.noteText}>"{eItem.note}"</Text>
                                    ) : null}
                                    
                                    {idx < data.emotions.length - 1 && <View style={styles.dividerSmall} />}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)', // Softer overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: Math.min(screenWidth * 0.85, 340),
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    modalBody: {
        gap: 12
    },
    emotionItem: {
        marginBottom: 4,
    },
    emotionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    emotionName: {
        fontSize: 16,
        fontWeight: '700',
    },
    scaleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563'
    },
    barContainer: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    noteText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 2,
        marginBottom: 4
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginTop: 12,
        marginBottom: 4,
        width: '100%',
    }
});
