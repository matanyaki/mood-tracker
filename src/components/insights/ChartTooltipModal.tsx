import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import PixelCard from '../ui/PixelCard';
import { getEmotionColor, getEmotionInk } from '../../constants/colors';
import { TYPE } from '../../constants/typography';
import { CARD_PADDING, SCREEN_GUTTER, SPACE } from '../../constants/layout';
import { OUTLINE, PAPER, INK_MUTED, BORDER_W_INNER } from '../../constants/pixel';

const screenWidth = Dimensions.get('window').width;

/** Cells in the 1-5 intensity readout: one block per point on the scale. */
const SCALE_CELLS = [1, 2, 3, 4, 5];

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
                <PixelCard padding={0} wrapperStyle={styles.cardWrapper}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>DAY {data.day}</Text>
                        <Text style={styles.modalSubtitle}>INTENSITY BREAKDOWN</Text>
                    </View>

                    <View style={styles.modalBody}>
                        {data.emotions.sort((a, b) => b.scale - a.scale).map((eItem, idx) => {
                            const emotionColor = getEmotionColor(eItem.emotionKey);
                            return (
                                <View key={idx} style={styles.emotionItem}>
                                    <View style={styles.emotionRow}>
                                        <Text style={[styles.emotionName, { color: getEmotionInk(eItem.emotionKey) }]}>
                                            {eItem.emotion.toUpperCase()}
                                        </Text>
                                        <Text style={styles.scaleText}>{eItem.scale}/5</Text>
                                    </View>

                                    {/* Five discrete cells rather than a proportional
                                        bar: the value IS an integer 1-5, so drawing it
                                        as a continuous length was always a rounding. */}
                                    <View style={styles.scaleTrack}>
                                        {SCALE_CELLS.map(cell => (
                                            <View
                                                key={cell}
                                                style={[
                                                    styles.scaleCell,
                                                    cell <= eItem.scale && { backgroundColor: emotionColor },
                                                    cell === SCALE_CELLS.length && styles.scaleCellLast,
                                                ]}
                                            />
                                        ))}
                                    </View>

                                    {eItem.note ? (
                                        <Text style={styles.noteText}>"{eItem.note}"</Text>
                                    ) : null}

                                    {idx < data.emotions.length - 1 && <View style={styles.dividerSmall} />}
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>[ TAP ANYWHERE TO CLOSE ]</Text>
                    </View>
                </PixelCard>
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
        padding: SCREEN_GUTTER,
    },
    cardWrapper: {
        width: Math.min(screenWidth * 0.85, 340),
    },
    modalHeader: {
        alignItems: 'center',
        padding: CARD_PADDING,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
    },
    modalTitle: {
        ...TYPE.h3,
        marginBottom: SPACE.xs,
    },
    modalSubtitle: {
        ...TYPE.caption,
        letterSpacing: 2,
    },
    modalBody: {
        padding: CARD_PADDING,
        gap: SPACE.md,
    },
    emotionItem: {
        marginBottom: SPACE.xs,
    },
    emotionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACE.sm,
    },
    emotionName: {
        ...TYPE.label,
    },
    scaleText: {
        ...TYPE.label,
        color: INK_MUTED,
    },
    scaleTrack: {
        flexDirection: 'row',
        height: 14,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
        backgroundColor: '#F1F5F9',
        marginBottom: SPACE.sm,
    },
    scaleCell: {
        flex: 1,
        borderRightWidth: 2,
        borderRightColor: PAPER,
    },
    scaleCellLast: {
        // No gutter on the last cell -- it would double up with the track's border.
        borderRightWidth: 0,
    },
    noteText: {
        ...TYPE.body,
        marginBottom: SPACE.xs,
        // No italic: RN fakes the slant on Silkscreen by shearing the bitmap.
    },
    dividerSmall: {
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
        borderStyle: 'dotted',
        marginTop: SPACE.md,
        marginBottom: SPACE.xs,
        width: '100%',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: SPACE.md,
        borderTopWidth: BORDER_W_INNER,
        borderTopColor: OUTLINE,
    },
    footerText: {
        ...TYPE.caption,
    },
});
