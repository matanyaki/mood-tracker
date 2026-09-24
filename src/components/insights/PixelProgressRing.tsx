import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { PIXEL_BOLD } from '../../constants/typography';
import { INK } from '../../constants/pixel';

/** Filled blocks while the goal is under way: the app's indigo accent. */
const RING_ACCENT = '#4F46E5';

/**
 * Filled blocks and the number once the week's target is met. The goal green, which
 * is already what "done" looks like -- it is the colour a ticked goal takes on Today.
 */
const RING_SUCCESS = '#10B981';

/** Empty blocks. Dark enough to read as a slot on PAPER, light enough to stay behind. */
const RING_TRACK = '#CBD5E1';

const BLOCK_COUNT = 12;
const SIZE = 88;
const BLOCK = 10;

/**
 * Top-left corner of each block, clockwise from 12 o'clock.
 *
 * Worked out once, not per render, because the layout never changes. Every corner is
 * rounded to a whole unit and the blocks are never rotated -- a rotated or fractional
 * square is anti-aliased, and the soft edge is exactly what this ring must not have.
 */
const BLOCKS = Array.from({ length: BLOCK_COUNT }, (_, i) => {
    const angle = (i / BLOCK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const radius = (SIZE - BLOCK) / 2;

    return {
        x: Math.round(SIZE / 2 + radius * Math.cos(angle) - BLOCK / 2),
        y: Math.round(SIZE / 2 + radius * Math.sin(angle) - BLOCK / 2),
    };
});

interface PixelProgressRingProps {
    /** 0..100, already rounded and clamped by the server. */
    percent: number;
}

/**
 * A progress ring drawn as twelve square blocks instead of an arc.
 *
 * Displays a percentage it is given; the only arithmetic here is turning that
 * percentage into a count of lit blocks.
 */
export default function PixelProgressRing({ percent }: PixelProgressRingProps) {
    const filledCount = Math.round((percent / 100) * BLOCK_COUNT);
    const fillColor = percent === 100 ? RING_SUCCESS : RING_ACCENT;

    return (
        <View style={styles.ring}>
            <Svg width={SIZE} height={SIZE}>
                {BLOCKS.map((block, i) => (
                    <Rect
                        key={i}
                        x={block.x}
                        y={block.y}
                        width={BLOCK}
                        height={BLOCK}
                        fill={i < filledCount ? fillColor : RING_TRACK}
                    />
                ))}
            </Svg>

            {/* Laid over the SVG as a native Text rather than an SVG <Text>, so it
                uses the loaded Silkscreen face the same way every other label does. */}
            <View style={styles.center} pointerEvents="none">
                <Text style={[styles.percent, percent === 100 && { color: RING_SUCCESS }]}>
                    {percent}%
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    ring: {
        width: SIZE,
        height: SIZE,
    },
    center: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percent: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
    },
});
