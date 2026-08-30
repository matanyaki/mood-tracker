import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ScreenContainer from '../ScreenContainer';
import SkeletonBox from './SkeletonBox';

/**
 * Mirrors TodayScreen: AppHeader (emoji + title + date subtitle) above a
 * ScrollView (padding 20, gap 16) holding the Morning Intentions card and the
 * QuoteCard, with the FabMenu button pinned bottom-right.
 */
export default function TodayScreenSkeleton() {
    return (
        <ScreenContainer variant="focus">
            {/* AppHeader with emoji */}
            <View style={styles.header}>
                <SkeletonBox width={32} height={32} borderRadius={16} />
                <View style={styles.headerText}>
                    <SkeletonBox width={80} height={22} borderRadius={6} />
                    <SkeletonBox
                        width={200}
                        height={14}
                        borderRadius={4}
                        style={styles.headerSubtitle}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
                {/* Morning Intentions card */}
                <View style={[styles.card, styles.intentionsCard]}>
                    <SkeletonBox width={165} height={18} borderRadius={5} />
                    <SkeletonBox
                        width={230}
                        height={16}
                        borderRadius={4}
                        style={styles.cardTextLine}
                    />
                </View>

                {/* QuoteCard */}
                <View style={[styles.card, styles.quoteCard]}>
                    <View style={styles.quoteHeaderRow}>
                        <SkeletonBox width={20} height={20} borderRadius={4} />
                        <SkeletonBox width={130} height={14} borderRadius={4} />
                    </View>

                    <SkeletonBox height={18} borderRadius={5} style={styles.quoteLine} />
                    <SkeletonBox height={18} borderRadius={5} style={styles.quoteLine} />
                    <SkeletonBox
                        width="60%"
                        height={18}
                        borderRadius={5}
                        style={styles.quoteLineLast}
                    />

                    <View style={styles.quoteFooterRow}>
                        <SkeletonBox width={100} height={14} borderRadius={4} />
                    </View>
                </View>
            </ScrollView>

            {/* FabMenu main button */}
            <SkeletonBox width={68} height={68} borderRadius={34} style={styles.fab} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerText: {
        flex: 1,
    },
    headerSubtitle: {
        marginTop: 6,
    },
    content: {
        padding: 20,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    intentionsCard: {
        backgroundColor: '#FFF',
        borderLeftColor: '#F59E0B',
    },
    cardTextLine: {
        marginTop: 10,
    },
    quoteCard: {
        backgroundColor: '#FDF2F8',
        borderLeftColor: '#DB2777',
    },
    quoteHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    quoteLine: {
        marginBottom: 10,
    },
    quoteLineLast: {
        marginBottom: 12,
    },
    quoteFooterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
});
