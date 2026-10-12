import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { OUTLINE } from '../../constants/pixel';

/**
 * One cell of the circle at its base size, in dp. 4 is also about the size of one
 * of the monk's own pixels at 160dp, so the two read as the same grid.
 */
const CELL = 4;

/** Cells across. 44 x 4 = 176dp at rest. */
const CELLS = 44;

/** How much bigger a full breath draws it: 176dp to 264dp, each cell 4dp to 6dp. */
const GROWTH = 1.5;

export const CIRCLE_BASE = CELL * CELLS;

/**
 * Side of the centred square that holds the circle at full size, its hard shadow
 * included. The shadow sticks out on one side only, but the circle grows from its
 * centre, so the square leaves the same room on both.
 */
export const CIRCLE_FULL = (CIRCLE_BASE + 2 * CELL) * GROWTH;

/** Pale indigo, the Insights icon tint: calm, and well apart from the orange monk. */
const FILL = '#E0E7FF';

/**
 * The circle, rasterised the way a pixel-art circle is drawn by hand: one run of
 * cells per row, and a narrower run inside it for the fill.
 *
 * A cell is outline when any of its four neighbours falls outside the circle, so
 * the fill run is the row's own run less a cell each side, clipped to the runs of
 * the rows above and below it. That gives an outline one cell thick all the way
 * round, steps included.
 *
 * Plain views rather than an SVG: a view's flat fill is redrawn at whatever scale
 * the breath sets, where an SVG is a bitmap on iOS and would go soft as it grows.
 */
const ROWS = (() => {
    const radius = CELLS / 2;
    /** Half the row's run, in cells. Rows off the grid have none. */
    const halfRun = (row: number) => {
        if (row < 0 || row >= CELLS) return 0;
        const fromCentre = row + 0.5 - radius;
        return Math.round(Math.sqrt(radius * radius - fromCentre * fromCentre));
    };

    return Array.from({ length: CELLS }, (_, row) => {
        const run = halfRun(row);
        const fill = Math.max(0, Math.min(run - 1, halfRun(row - 1), halfRun(row + 1)));
        return { outline: run * 2 * CELL, fill: fill * 2 * CELL };
    });
})();

interface BreathCircleProps {
    /** 0 at the circle's base size, 1 at its full size. */
    fullness: Readonly<SharedValue<number>>;
}

/**
 * The breathing guide: a pixel-art circle that grows on the breath in, stays full
 * on the hold and shrinks back to its base size on the breath out.
 *
 * It only draws. The size comes from the session clock as a 0-1 value and is
 * applied as a scale on the UI thread, so the circle never re-renders while the
 * session runs. Decoration to a screen reader: the phase, the countdown and the
 * cycle are all said in text beside it.
 */
function BreathCircle({ fullness }: BreathCircleProps) {
    const breathStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + (GROWTH - 1) * fullness.value }],
    }));

    return (
        <Animated.View
            style={[styles.circle, breathStyle]}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {/* Hard shadow: the same silhouette, one cell down and to the right. */}
            <View style={styles.shadow}>
                {ROWS.map((row, i) => (
                    <View key={i} style={[styles.row, styles.shadowRow, { width: row.outline }]} />
                ))}
            </View>

            {ROWS.map((row, i) => (
                <View key={i} style={[styles.row, styles.outlineRow, { width: row.outline }]}>
                    {row.fill > 0 && <View style={[styles.row, styles.fillRow, { width: row.fill }]} />}
                </View>
            ))}
        </Animated.View>
    );
}

// Memoised: the screen re-renders every second for its countdown, and the circle's
// hundred-odd views have nothing to redraw then -- its motion never goes through React.
export default memo(BreathCircle);

const styles = StyleSheet.create({
    circle: {
        width: CIRCLE_BASE,
        height: CIRCLE_BASE,
        alignItems: 'center',
    },
    shadow: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        transform: [{ translateX: CELL }, { translateY: CELL }],
    },
    row: {
        height: CELL,
    },
    shadowRow: {
        backgroundColor: OUTLINE,
    },
    outlineRow: {
        backgroundColor: OUTLINE,
        alignItems: 'center',
    },
    fillRow: {
        backgroundColor: FILL,
    },
});
