import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ScreenContainer from '../layout/ScreenContainer';
import PixelCard from '../ui/PixelCard';
import SkeletonBox from './SkeletonBox';
import { OUTLINE, BORDER_W_INNER } from '../../constants/pixel';
import { TYPE } from '../../constants/typography';
import {
    CARD_PADDING, HEADING_GAP, ROW_PADDING_H, ROW_PADDING_V, SCREEN_GUTTER, SCREEN_TOP,
    SECTION_GAP, SPACE,
} from '../../constants/layout';

// Every box is square-cornered: a rounded placeholder that resolves into a
// pixel card announces the wrong shape for the half second it is up.
const SQUARE = 0;

/**
 * Mirrors ProfileScreen's authenticated view: AppHeader ("Profile") above a
 * ScrollView (the shared screen gutter) holding the user card (avatar + name/email/badge),
 * an "[ ACCOUNT ]" menu card with two rows, and an "[ ACTIONS ]" card with one.
 */
export default function ProfileScreenSkeleton() {
    return (
        <ScreenContainer variant="calm">
            <View style={styles.header}>
                <SkeletonBox width={90} height={TYPE.h1.lineHeight} borderRadius={SQUARE} />
            </View>

            <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
                {/* User card */}
                <PixelCard padding={CARD_PADDING} accentColor="#4F46E5" wrapperStyle={styles.userCardWrapper}>
                    <View style={styles.userRow}>
                        <SkeletonBox width={54} height={54} borderRadius={SQUARE} />
                        <View style={styles.userText}>
                            <SkeletonBox width={70} height={14} borderRadius={SQUARE} />
                            <SkeletonBox
                                width={150}
                                height={12}
                                borderRadius={SQUARE}
                                style={styles.userEmail}
                            />
                            <SkeletonBox width={58} height={18} borderRadius={SQUARE} />
                        </View>
                    </View>
                </PixelCard>

                {/* Account section */}
                <SkeletonBox width={80} height={12} borderRadius={SQUARE} style={styles.sectionTitle} />
                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRowSkeleton width={100} />
                    <MenuRowSkeleton width={150} isLast />
                </PixelCard>

                {/* Actions section */}
                <SkeletonBox width={74} height={12} borderRadius={SQUARE} style={styles.sectionTitle} />
                <PixelCard padding={0} wrapperStyle={styles.menuCardWrapper}>
                    <MenuRowSkeleton width={70} isLast />
                </PixelCard>

                <SkeletonBox
                    width={110}
                    height={12}
                    borderRadius={SQUARE}
                    style={styles.versionText}
                />
            </ScrollView>
        </ScreenContainer>
    );
}

/** One MenuRow: 32px icon box, label, trailing chevron. */
function MenuRowSkeleton({ width, isLast = false }: { width: number; isLast?: boolean }) {
    return (
        <View style={[styles.menuRow, !isLast && styles.menuRowDivided]}>
            <SkeletonBox width={32} height={32} borderRadius={SQUARE} />
            <SkeletonBox width={width} height={12} borderRadius={SQUARE} />
            <View style={styles.menuSpacer} />
            <SkeletonBox width={16} height={16} borderRadius={SQUARE} />
        </View>
    );
}

const styles = StyleSheet.create({
    // Matches AppHeader: the same gutter and vertical padding, so the real title
    // lands where the placeholder was.
    header: {
        paddingHorizontal: SCREEN_GUTTER,
        paddingVertical: SPACE.md,
    },
    content: {
        paddingHorizontal: SCREEN_GUTTER,
        paddingTop: SCREEN_TOP,
    },
    userCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md,
    },
    userText: {
        flex: 1,
    },
    userEmail: {
        marginTop: SPACE.xs,
        marginBottom: SPACE.xs,
    },
    sectionTitle: {
        marginBottom: HEADING_GAP,
    },
    menuCardWrapper: {
        marginBottom: SECTION_GAP,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACE.md,
        paddingVertical: ROW_PADDING_V,
        paddingHorizontal: ROW_PADDING_H,
    },
    menuRowDivided: {
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    menuSpacer: {
        flex: 1,
    },
    versionText: {
        alignSelf: 'center',
    },
});
