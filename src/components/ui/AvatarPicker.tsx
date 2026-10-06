import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Modal, View, Text, Image, Pressable, FlatList, StyleSheet,
    useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import PixelCard from './PixelCard';
import { AVATAR_IDS, AVATAR_IMAGES } from '../../constants/avatars';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W, BORDER_W_INNER } from '../../constants/pixel';

const INDIGO = '#4F46E5';

const COLS = 4;
const ROWS = 6;
const PER_PAGE = COLS * ROWS;
const GAP = 8;
const CARD_PADDING = 16;

const PAGES: string[][] = [];
for (let i = 0; i < AVATAR_IDS.length; i += PER_PAGE) {
    PAGES.push(AVATAR_IDS.slice(i, i + PER_PAGE));
}

const pageOf = (id?: string | null) => {
    const index = id ? AVATAR_IDS.indexOf(id) : -1;
    return index < 0 ? 0 : Math.floor(index / PER_PAGE);
};

interface AvatarPickerProps {
    visible: boolean;
    /** The avatar currently on the profile; opens on its page, highlighted. */
    selectedId?: string | null;
    onSelect: (id: string) => void;
    onClose: () => void;
}

/**
 * A 4x6 grid of preset avatars, one page at a time.
 *
 * Paged rather than one long scroll so only the visible page (and its neighbours,
 * via `windowSize`) decodes images — 24 at a time instead of all of them. Tapping
 * a cell only highlights it; SELECT commits, so a stray tap while swiping costs
 * nothing.
 */
export default function AvatarPicker({ visible, selectedId, onSelect, onClose }: AvatarPickerProps) {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const listRef = useRef<FlatList<string[]>>(null);

    const [draft, setDraft] = useState<string | null>(selectedId ?? null);
    const [page, setPage] = useState(pageOf(selectedId));

    // Each opening starts from what's saved, not from the last abandoned draft.
    useEffect(() => {
        if (visible) {
            setDraft(selectedId ?? null);
            setPage(pageOf(selectedId));
        }
    }, [visible, selectedId]);

    const dialogWidth = Math.min(windowWidth - 48, 420);
    const pageWidth = dialogWidth - 2 * (BORDER_W + CARD_PADDING);
    // Fit the width, but never let six rows push the buttons off a short screen.
    const cell = Math.floor(Math.min(
        (pageWidth - (COLS - 1) * GAP) / COLS,
        (windowHeight * 0.55 - (ROWS - 1) * GAP) / ROWS,
    ));
    const gridWidth = cell * COLS + GAP * (COLS - 1);
    const gridHeight = cell * ROWS + GAP * (ROWS - 1);

    const goTo = useCallback((next: number) => {
        const clamped = Math.max(0, Math.min(PAGES.length - 1, next));
        listRef.current?.scrollToIndex({ index: clamped, animated: true });
        setPage(clamped);
    }, []);

    const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
    }, [pageWidth]);

    const getItemLayout = useCallback((_: unknown, index: number) => (
        { length: pageWidth, offset: pageWidth * index, index }
    ), [pageWidth]);

    const renderPage = useCallback(({ item }: { item: string[] }) => (
        <View style={{ width: pageWidth, alignItems: 'center' }}>
            <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
                {item.map(id => {
                    const isSelected = id === draft;
                    return (
                        <Pressable
                            key={id}
                            onPress={() => setDraft(id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Avatar ${AVATAR_IDS.indexOf(id) + 1}`}
                            style={({ pressed }) => [
                                styles.cell,
                                { width: cell, height: cell },
                                isSelected && styles.cellSelected,
                                pressed && styles.cellPressed,
                            ]}
                        >
                            <Image source={AVATAR_IMAGES[id]} style={styles.cellImage} resizeMode="contain" />
                            {isSelected && (
                                <View style={styles.checkBadge}>
                                    <Check size={10} color="#fff" strokeWidth={4} />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    ), [pageWidth, gridWidth, gridHeight, cell, draft]);

    const handleSelect = () => {
        if (draft) onSelect(draft);
        onClose();
    };

    const canSelect = !!draft && draft !== selectedId;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <PixelCard padding={CARD_PADDING} wrapperStyle={{ width: dialogWidth }}>
                    <View style={styles.header}>
                        <Text style={styles.title}>CHOOSE AVATAR</Text>
                    </View>

                    <FlatList
                        ref={listRef}
                        data={PAGES}
                        keyExtractor={(_, index) => String(index)}
                        renderItem={renderPage}
                        extraData={draft}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        getItemLayout={getItemLayout}
                        initialScrollIndex={pageOf(selectedId)}
                        onMomentumScrollEnd={onScrollEnd}
                        initialNumToRender={1}
                        maxToRenderPerBatch={1}
                        windowSize={3}
                        style={{ width: pageWidth, height: gridHeight }}
                    />

                    <View style={styles.pager}>
                        <Pressable
                            onPress={() => goTo(page - 1)}
                            disabled={page === 0}
                            hitSlop={8}
                            accessibilityLabel="Previous page"
                            style={({ pressed }) => [
                                styles.pagerButton,
                                page === 0 && styles.pagerButtonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            <ChevronLeft size={16} color={page === 0 ? INK_MUTED : INK} strokeWidth={3} />
                        </Pressable>

                        <View style={styles.dots}>
                            {PAGES.map((_, index) => (
                                <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
                            ))}
                        </View>

                        <Pressable
                            onPress={() => goTo(page + 1)}
                            disabled={page === PAGES.length - 1}
                            hitSlop={8}
                            accessibilityLabel="Next page"
                            style={({ pressed }) => [
                                styles.pagerButton,
                                page === PAGES.length - 1 && styles.pagerButtonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            <ChevronRight
                                size={16}
                                color={page === PAGES.length - 1 ? INK_MUTED : INK}
                                strokeWidth={3}
                            />
                        </Pressable>
                    </View>

                    <View style={styles.buttons}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                        >
                            <Text style={styles.buttonText}>CANCEL</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleSelect}
                            disabled={!canSelect}
                            style={({ pressed }) => [
                                styles.button,
                                styles.buttonPrimary,
                                !canSelect && styles.buttonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>SELECT</Text>
                        </Pressable>
                    </View>
                </PixelCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // The same flat dim as PixelAlert and the PixelSelect panel.
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    header: {
        paddingBottom: 12,
        marginBottom: 14,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    title: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: GAP,
    },
    cell: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7FF',
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    cellSelected: {
        borderWidth: BORDER_W,
        borderColor: INDIGO,
        backgroundColor: '#C7D2FE',
    },
    cellPressed: {
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    cellImage: {
        width: '84%',
        height: '84%',
    },
    checkBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: INDIGO,
    },
    pager: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 16,
    },
    pagerButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    pagerButtonDisabled: {
        backgroundColor: '#EDE9E0',
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        backgroundColor: '#CBD5E1',
    },
    dotActive: {
        backgroundColor: INDIGO,
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: PAPER,
        borderWidth: BORDER_W_INNER,
        borderColor: OUTLINE,
    },
    buttonPrimary: {
        backgroundColor: INK,
    },
    buttonDisabled: {
        backgroundColor: '#CBD5E1',
        borderColor: '#94A3B8',
    },
    buttonPressed: {
        // Sinks toward its own corner, the way every other pixel control answers a press.
        transform: [{ translateX: 1 }, { translateY: 1 }],
    },
    buttonText: {
        fontSize: 11,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 1,
    },
    buttonTextPrimary: {
        color: '#fff',
    },
});
