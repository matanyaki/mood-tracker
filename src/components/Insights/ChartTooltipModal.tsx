import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Info } from 'lucide-react-native';

interface TooltipData {
    day: number;
    emotions: { emotion: string; scale: number; note: string }[];
}

interface ChartTooltipModalProps {
    visible: boolean;
    data: TooltipData | null;
    onClose: () => void;
}

export default function ChartTooltipModal({ visible, data, onClose }: ChartTooltipModalProps) {
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
                        <Info size={24} color="#4F46E5" />
                        <Text style={styles.modalTitle}>Point Details</Text>
                    </View>
                    {data && (
                        <View style={styles.modalBody}>
                            <Text style={styles.detailText}>
                                <Text style={styles.detailBold}>Date:</Text> Day {data.day} of Selected Month
                            </Text>

                            <View style={styles.divider} />

                            {data.emotions.length > 0 ? (
                                data.emotions.map((eItem, idx) => (
                                    <View key={idx} style={styles.emotionItem}>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.detailBold}>Emotion:</Text> {eItem.emotion}
                                        </Text>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.detailBold}>Intensity Scale:</Text> {eItem.scale}/5
                                        </Text>
                                        <Text style={styles.detailText}>
                                            <Text style={styles.detailBold}>Note:</Text> {eItem.note}
                                        </Text>
                                        {idx < data.emotions.length - 1 && <View style={styles.dividerSmall} />}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.detailText}>No emotions recorded on this day.</Text>
                            )}
                        </View>
                    )}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A2E'
    },
    modalBody: {
        marginBottom: 24,
        gap: 8
    },
    emotionItem: {
        marginBottom: 8,
        gap: 4
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12
    },
    dividerSmall: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8,
        width: '60%',
        alignSelf: 'center'
    },
    detailText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24
    },
    detailBold: {
        fontWeight: 'bold',
        color: '#111827'
    },
    closeBtn: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center'
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
