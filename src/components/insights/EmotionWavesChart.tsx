import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Rect } from 'react-native-svg';
import { Droplets } from 'lucide-react-native';
import PixelCard from '../ui/PixelCard';
import PixelSelect from '../ui/PixelSelect';
import { EMOTIONS_CONFIG, type EmotionId } from '../../constants/emotions';
import { getEmotionColor } from '../../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../../constants/typography';
import {
    OUTLINE, INK, INK_MUTED,
    SHADOW_OFFSET, BORDER_W, BORDER_W_INNER,
} from '../../constants/pixel';

const screenWidth = Dimensions.get('window').width;

/** Side of the square plotted in place of chart-kit's round dot. */
const DOT_SIZE = 10;

// Strongly type the chart dataset and data contract
export interface ChartDataset {
    emotionKey: string;
    color?: (opacity?: number) => string;
    data: number[];
    strokeWidth?: number;
    meta?: { scale: number; note: string }[];
    withDots?: boolean;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

interface EmotionWavesChartProps {
    chartData: ChartData;
    handleDataPointClick: (data: any) => void;
    isFetching?: boolean;
    hasData?: boolean;
}

export default function EmotionWavesChart({ chartData, handleDataPointClick, isFetching, hasData = true }: EmotionWavesChartProps) {
    // One emotion is plotted at a time: the picker below the header chooses
    // which of the rows the screen hands over becomes the wave, the day squares
    // and the tooltip behind them.
    // First of the shared taxonomy rather than a named id, so the default survives
    // that emotion being renamed or reordered out of the list.
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>(EMOTIONS_CONFIG[0].id);

    // Straight off the shared taxonomy, in its order: an emotion added there
    // shows up here without this file being touched.
    const emotionOptions = EMOTIONS_CONFIG.map(e => ({ label: e.label, value: e.id }));
    const selectedLabel = EMOTIONS_CONFIG.find(e => e.id === selectedEmotion)?.label ?? '';
    // The emotion's own colour off the shared taxonomy, drawing the line, the
    // fill under it and the day squares alike -- so the wave reads as that
    // emotion without a key underneath telling you which one it is.
    const selectedColor = getEmotionColor(selectedEmotion);

    // The card no longer breaks out of the screen's padding with a negative
    // margin: it draws a hard shadow block on its right edge now, and a card
    // hanging over the screen edge would take that block off with it.
    const SCREEN_PADDING = 40;      // InsightsScreen content padding, both sides
    const CARD_BORDERS = BORDER_W * 2;
    const CHART_RIGHT_GUTTER = 16;  // Room for the last day label
    const chartWidth = screenWidth
        - SCREEN_PADDING
        - SHADOW_OFFSET
        - CARD_BORDERS
        - CHART_RIGHT_GUTTER;

    const processedData = useMemo(() => {
        if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
            return {
                labels: [],
                datasets: [],
                dayHasEntry: [],
                totalDataPoints: 0,
                hasValidData: false,
                monthHasData: false
            };
        }

        const labels = chartData.labels || [];
        const numDays = labels.length;

        // The picked emotion's row, and only it. Days it was not logged on stay
        // flat rather than borrowing another emotion's intensity.
        const selectedSeries = chartData.datasets.find(ds => ds.emotionKey === selectedEmotion);

        const intensities = Array(numDays).fill(1); // default to 1 so the wave doesn't collapse below the grid
        const dayHasEntry = Array(numDays).fill(false);
        let totalDataPoints = 0;

        for (let i = 0; i < numDays; i++) {
            const val = selectedSeries?.data[i];
            if (typeof val === 'number' && !isNaN(val) && val > 0) {
                intensities[i] = val;
                dayHasEntry[i] = true;
                totalDataPoints++;
            }
        }

        // A different question from the one above: whether the month holds any
        // entry at all. A month with entries but none of the picked emotion has
        // to keep the card -- and the picker inside it -- on screen, or there is
        // no way back to an emotion that does have days.
        const monthHasData = chartData.datasets.some(ds => ds.data.some(v => v > 0));

        // Filter X-axis labels: show exactly 1, 7, 14, 21, 28 as days of the month
        const displayLabels = labels.map((label, index) => {
            const dayNum = parseInt(label.replace(/\D/g, ''), 10);
            const isMatch = dayNum === 1 || dayNum === 7 || dayNum === 14 || dayNum === 21 || dayNum === 28 ||
                            index === 0 || index === 6 || index === 13 || index === 20 || index === 27;
            return isMatch ? label : '';
        });

        const datasets: ChartDataset[] = [
            {
                emotionKey: selectedEmotion,
                data: intensities,
                // Carried over from the source row: chart-kit hands the tapped
                // dataset back to onDataPointClick, which is how the day tooltip
                // gets this emotion's scale and note without a second lookup.
                meta: selectedSeries?.meta,
                color: () => selectedColor,
                // Heavier than the old 2: a pixel line is drawn, not traced.
                strokeWidth: 3,
            },
            // Y-axis bounds. chart-kit has no min/max prop, so the 1-5 domain has to
            // be injected as data -- but the old full-length [1, 5, 1, 1, ...] row
            // painted a grey triangle across the first days of every month. A
            // dataset cannot opt out of the area fill, and it cannot hide behind a
            // transparent colour either: react-native-svg masks the alpha off a
            // gradient's stopColor and takes it from chartConfig's
            // fillShadowGradient*Opacity instead, so rgba(0, 0, 0, 0) came out black
            // at 14%.
            //
            // Single-point rows dodge it. renderShadow spaces a polygon by that
            // dataset's own length, so with one point every vertex lands on the same
            // x and the fill collapses to zero width. The scale still sees both
            // values -- it reads all datasets flattened together -- and dot spacing
            // is untouched, since that comes from the longest dataset.
            { emotionKey: 'y_min_bound', data: [1], color: () => 'transparent', withDots: false },
            { emotionKey: 'y_max_bound', data: [5], color: () => 'transparent', withDots: false },
        ];

        return {
            labels: displayLabels,
            datasets,
            dayHasEntry,
            totalDataPoints,
            hasValidData: totalDataPoints > 0,
            monthHasData
        };
    }, [chartData, selectedEmotion, selectedColor]);

    /**
     * Square markers, drawn as SVG rects inside the chart.
     *
     * chart-kit only ever draws its markers as <Circle>, so the real dot is
     * shrunk to r=0 by getDotProps below and replaced here. The invisible r=14
     * circle the library stacks on top for the tap target is untouched, so the
     * day tooltip still opens.
     */
    const renderSquareDot = useCallback(({ x, y, index }: { x: number; y: number; index: number }) => {
        if (!processedData.dayHasEntry[index]) return null;

        return (
            <Rect
                key={`dot-${index}`}
                x={x - DOT_SIZE / 2}
                y={y - DOT_SIZE / 2}
                width={DOT_SIZE}
                height={DOT_SIZE}
                fill={selectedColor}
                stroke={OUTLINE}
                strokeWidth={2}
            />
        );
    }, [processedData, selectedColor]);

    const showEmptyState = !hasData || !processedData.monthHasData;

    if (showEmptyState) {
        return (
            <PixelCard padding={24} wrapperStyle={styles.cardWrapper} style={styles.emptyCard}>
                <Droplets size={40} color={INK_MUTED} strokeWidth={2.5} />
                <Text style={styles.emptyTitle}>NO WAVES YET</Text>
                <Text style={styles.emptyText}>
                    Start journaling to see your emotion wave take shape.
                </Text>
            </PixelCard>
        );
    }

    return (
        <PixelCard padding={0} wrapperStyle={styles.cardWrapper} style={styles.chartCard}>
            {/* No spinner here. It was fed by `isFetching`, which is true for the
                first load and every background refetch, so it span on a screen that
                was not waiting for anything the user had asked for -- and it was the
                "stuck wheel" whenever a fetch behind it was slow or failing. The
                card dims instead, which needs no animation to stay honest. */}
            <View style={styles.headerContainer}>
                <View style={styles.headerText}>
                    <Text style={styles.chartTitle}>EMOTION WAVE CHART</Text>
                    <Text style={styles.chartSubtitle}>Y: INTENSITY 1-5 | X: DAY</Text>
                </View>
            </View>

            {/* Same control the month and year filters use, so the two rows of
                filtering on this screen answer to one set of manners. */}
            <View style={styles.selectorRow}>
                <PixelSelect
                    eyebrow="[ EMOTION ]"
                    options={emotionOptions}
                    value={selectedEmotion}
                    onChange={value => setSelectedEmotion(value as EmotionId)}
                    flex={1}
                />
            </View>

            {processedData.totalDataPoints === 1 && (
                <Text style={styles.singleEntryHint}>
                    Keep journaling — your wave forms with more entries
                </Text>
            )}

            {processedData.hasValidData ? (
                <View style={{ opacity: isFetching ? 0.7 : 1 }}>
                    <LineChart
                        data={processedData}
                        width={chartWidth}
                        height={320}
                        yAxisLabel=""
                        yAxisSuffix=""
                        yAxisInterval={1}
                        yLabelsOffset={8}
                        fromZero={false}
                        segments={4}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        withOuterLines={false}
                        chartConfig={{
                            backgroundColor: "transparent",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            backgroundGradientFromOpacity: 0,
                            backgroundGradientToOpacity: 0,
                            decimalPlaces: 0,
                            useShadowColorFromDataset: true,
                            // Only a fallback -- every dataset above brings its
                            // own colour -- but an indigo left here would be a
                            // second answer to what colour this chart is.
                            color: () => selectedColor,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            // Same value top and bottom: the area under the wave is a
                            // flat block of colour, not a gradient fading out. A ramp is
                            // exactly the sub-pixel detail this style has nowhere to put.
                            fillShadowGradientFromOpacity: 0.14,
                            fillShadowGradientToOpacity: 0.14,
                            propsForBackgroundLines: {
                                // A drawn rule rather than a hairline wash: same dotted
                                // treatment the card dividers use.
                                strokeDasharray: "2 5",
                                strokeWidth: 2,
                                stroke: "rgba(100, 116, 139, 0.45)"
                            },
                            // The chart draws its axis labels as SVG text, so the pixel
                            // face has to be passed in here rather than via a style.
                            propsForLabels: {
                                fontFamily: PIXEL,
                                fontSize: 9, // Silkscreen is wide -- the default crowds the axis
                            },
                        }}
                        // No `bezier`: a smoothed curve is the one shape a pixel grid
                        // cannot draw. Straight segments between days also say plainly
                        // that nothing was measured in between.
                        getDotColor={() => selectedColor}
                        // Every built-in circle collapses to nothing; renderDotContent
                        // draws the square that replaces it.
                        getDotProps={() => ({ r: '0' })}
                        renderDotContent={renderSquareDot}
                        style={styles.chart}
                        onDataPointClick={handleDataPointClick}
                    />
                </View>
            ) : (
                <View style={styles.noSeries}>
                    <Text style={styles.noSeriesTitle}>
                        NO {selectedLabel.toUpperCase()} DAYS THIS MONTH
                    </Text>
                    <Text style={styles.noSeriesText}>
                        Pick another emotion to see its wave.
                    </Text>
                </View>
            )}
        </PixelCard>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 20,
    },
    chartCard: {
        alignItems: 'center',
        minHeight: 220,
        paddingBottom: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        padding: 14,
        paddingBottom: 12,
        borderBottomWidth: BORDER_W_INNER,
        borderBottomColor: OUTLINE,
        borderStyle: 'dotted',
    },
    headerText: {
        flex: 1,
    },
    chartTitle: {
        fontSize: 13,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
    },
    chartSubtitle: {
        fontSize: 9,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 1,
        marginTop: 6,
    },
    selectorRow: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 14,
        paddingTop: 14,
    },
    noSeries: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 44,
        paddingHorizontal: 20,
    },
    noSeriesTitle: {
        fontSize: 12,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 10,
    },
    noSeriesText: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    singleEntryHint: {
        fontSize: 10,
        fontFamily: PIXEL,
        color: INK_MUTED,
        letterSpacing: 0.5,
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        // No italic: Silkscreen ships one upright face per weight, so RN fakes the
        // slant by shearing the bitmap, which tears the pixel grid.
    },
    chart: {
        marginVertical: 10,
        paddingRight: 16, // The gutter reserved out of chartWidth above
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        minHeight: 220,
    },
    emptyTitle: {
        fontSize: 14,
        fontFamily: PIXEL_BOLD,
        color: INK,
        letterSpacing: 2,
        marginTop: 16,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 11,
        fontFamily: PIXEL,
        color: INK_MUTED,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
});
