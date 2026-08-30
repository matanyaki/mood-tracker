import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ScreenContainer from '../ScreenContainer';
import Card from '../Card';
import SkeletonBox from './SkeletonBox';

/**
 * Mirrors ProfileScreen's authenticated view: AppHeader ("Profile") above a
 * ScrollView (padding 20) holding the user Card (avatar + name/email/badge),
 * an "Account" menu Card with two rows, and an "Actions" menu Card with one.
 */
export default function ProfileScreenSkeleton() {
    return (
        <ScreenContainer>
            <View style={styles.header}>
                <SkeletonBox width={90} height={22} borderRadius={6} />
            </View>

            <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
                {/* User card */}
                <Card padding={20} style={styles.userCard}>
                    <SkeletonBox width={60} height={60} borderRadius={30} />
                    <View style={styles.userTextGroup}>
                        <SkeletonBox width={80} height={20} borderRadius={5} />
                        <SkeletonBox
                            width={165}
                            height={14}
                            borderRadius={4}
                            style={styles.userEmail}
                        />
                        <SkeletonBox width={56} height={18} borderRadius={12} />
                    </View>
                </Card>

                {/* Account section */}
                <SkeletonBox width={90} height={18} borderRadius={5} style={styles.sectionTitle} />
                <Card padding={0} style={styles.menuCard}>
                    <MenuRowSkeleton width={100} />
                    <View style={styles.divider} />
                    <MenuRowSkeleton width={150} />
                </Card>

                {/* Actions section */}
                <SkeletonBox width={80} height={18} borderRadius={5} style={styles.sectionTitle} />
                <Card padding={0} style={styles.menuCard}>
                    <MenuRowSkeleton width={70} />
                </Card>

                <SkeletonBox
                    width={120}
                    height={12}
                    borderRadius={4}
                    style={styles.versionText}
                />
            </ScrollView>
        </ScreenContainer>
    );
}

/** One MenuRow: 36px icon box, label, trailing chevron. */
function MenuRowSkeleton({ width }: { width: number }) {
    return (
        <View style={styles.menuRow}>
            <SkeletonBox width={36} height={36} borderRadius={8} style={styles.iconBox} />
            <SkeletonBox width={width} height={16} borderRadius={4} />
            <View style={styles.menuSpacer} />
            <SkeletonBox width={20} height={20} borderRadius={4} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    content: {
        padding: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 25,
    },
    userTextGroup: {
        flex: 1,
    },
    userEmail: {
        marginTop: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        overflow: 'hidden',
        marginBottom: 25,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    iconBox: {
        marginRight: 15,
    },
    menuSpacer: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 67,
    },
    versionText: {
        alignSelf: 'center',
        marginTop: 10,
    },
});
