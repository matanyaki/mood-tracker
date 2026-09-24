import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Text, Pressable } from 'react-native';
import { ScreenContainer, AppHeader, PixelCard } from '../components';
import { InsightsStatsSkeleton } from '../components/skeleton';
import { useInsightsController } from '../controllers/useInsightsController';
import { useGoalProgressQuery } from '../hooks/useGoalsQuery';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import { getEmotionColor } from '../constants/colors';
import { PIXEL, PIXEL_BOLD } from '../constants/typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from '../constants/pixel';

import FilterRow from '../components/insights/FilterRow';
import SummaryCards from '../components/insights/SummaryCards';
import EmotionBreakdown from '../components/insights/EmotionBreakdown';
import EmotionWavesChart from '../components/insights/EmotionWavesChart';
import ChartTooltipModal, { TooltipData } from '../components/insights/ChartTooltipModal';
import GoalsProgress from '../components/insights/GoalsProgress';
import MonthlyReassurance from '../components/insights/MonthlyReassurance';

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

export default function InsightsScreen({ navigation }: any) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const monthParam = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
  const {
    loading, isFetching, isRefreshing, error,
    entries, aggregatedEntries, emotionCounts, refreshStats,
  } = useInsightsController(monthParam);

  // Not part of the month filter: each ring covers its goal's whole run.
  const {
    data: goalProgress,
    isPending: goalProgressPending,
    refetch: refetchGoalProgress,
  } = useGoalProgressQuery();

  const handleRefresh = useCallback(() => {
    refetchGoalProgress();
    return refreshStats();
  }, [refetchGoalProgress, refreshStats]);

  // Tooltip Modal State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // Parse entries to process chart data
  const { chartData, filteredStats, filteredTotalEntries, dayEntries } = useMemo(() => {
    const daysInMonth = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear));

    // Determine label step to show only 1, 7, 14, 21, 28 and the last day
    const labels = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      if (day === 1 || day === 7 || day === 14 || day === 21 || day === 28 || day === daysInMonth) {
        return day.toString();
      }
      return "";
    });

    const emotionDataMap: Record<string, { scale: number; note: string }[]> = {};

    EMOTIONS_CONFIG.forEach(emotion => {
      emotionDataMap[emotion.id] = Array(daysInMonth).fill({ scale: 0, note: '' });
    });

    // Filter raw entries for stats/summary
    const filteredRaw = (entries || []).filter((entry: any) => {
      if (!entry.date) return false;
      const parts = entry.date.split('-');
      if (parts.length !== 3) return false;
      const entryYear = parseInt(parts[0], 10);
      const entryMonth = parseInt(parts[1], 10);
      
      return entryMonth === parseInt(selectedMonth, 10) &&
        entryYear === parseInt(selectedYear, 10);
    });

    // Filter aggregated entries for chart visualization
    const filteredAggregated = (aggregatedEntries || []).filter((entry: any) => {
      if (!entry.date) return false;
      const parts = entry.date.split('-');
      if (parts.length !== 3) return false;
      const entryYear = parseInt(parts[0], 10);
      const entryMonth = parseInt(parts[1], 10);
      
      return entryMonth === parseInt(selectedMonth, 10) &&
        entryYear === parseInt(selectedYear, 10);
    });

    filteredAggregated.forEach((entry: any) => {
      if (!entry.date) return;
      const parts = entry.date.split('-');
      if (parts.length !== 3) return;
      const dayIndex = parseInt(parts[2], 10) - 1;

      if (entry.emotions && dayIndex >= 0 && dayIndex < daysInMonth) {
        entry.emotions.forEach((eItem: any) => {
          const key = eItem.id;
          if (emotionDataMap[key]) {
            emotionDataMap[key][dayIndex] = {
              scale: eItem.scale,
              note: eItem.note || ''
            };
          }
        });
      }
    });

    // Counts come from GET /api/entries/stats — this only shapes them for display
    // (label, color, share of the month). Nothing is counted on device.
    //
    // Summed over the known taxonomy rather than over every key the server sent:
    // documents written before the scale rework have no emotion id, so they land
    // under an `undefined` key that no row ever displays. Left in the total it
    // would shrink every percentage on the card to pay for a row nobody can see.
    const totalEmotions = EMOTIONS_CONFIG.reduce(
      (sum, emotion) => sum + (emotionCounts[emotion.id] || 0),
      0
    );

    const stats = EMOTIONS_CONFIG.map(emotion => {
      const count = emotionCounts[emotion.id] || 0;
      return {
        label: emotion.label,
        count: count,
        color: getEmotionColor(emotion.id),
        percentage: totalEmotions > 0 ? (count / totalEmotions) * 100 : 0
      };
    }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

    const filteredTotal = filteredRaw.length;

    // Generate unstacked datasets for direct 1-5 scale plotting
    const datasets = EMOTIONS_CONFIG.map((emotion) => {
      const data = emotionDataMap[emotion.id].map(item => item.scale);

      return {
        emotionKey: emotion.id,
        color: () => getEmotionColor(emotion.id),
        data: data,
        strokeWidth: 2,
        meta: emotionDataMap[emotion.id] // Keep unstacked metadata
      };
    });

    return {
      chartData: {
        labels: labels,
        datasets: datasets
      },
      filteredStats: stats,
      filteredTotalEntries: filteredTotal,
      // One per journaled day, already collapsed by the controller — what the
      // reassurance card reads the month's shape off.
      dayEntries: filteredAggregated
    };
  }, [entries, aggregatedEntries, emotionCounts, selectedMonth, selectedYear]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()];
  }, []);

  const handleDataPointClick = useCallback((data: any) => {
    // The chart plots one emotion at a time and hands that dataset back with the
    // tap, so the tooltip answers for the emotion on screen rather than reading
    // every row for the day. The axis-bound datasets carry no meta and no id in
    // the taxonomy, so a tap that lands on one falls out here.
    const metaInfo = data?.dataset?.meta?.[data.index];
    const emotion = EMOTIONS_CONFIG.find(e => e.id === data?.dataset?.emotionKey);

    if (!emotion || !metaInfo || metaInfo.scale <= 0) return;

    setTooltipData({
      day: data.index + 1,
      emotions: [{
        emotionKey: emotion.id,
        emotion: emotion.label,
        scale: metaInfo.scale,
        note: metaInfo.note || ""
      }],
      x: data.x, // Passed from react-native-chart-kit
      y: data.y
    });
    setTooltipVisible(true);
  }, []);

  return (
    <ScreenContainer variant="calm">
      {/* AppHeader is shared with four other screens, so the pixel treatment is
          passed in here rather than baked into the component. */}
      <AppHeader
        title="Insights"
        subtitle="Track your emotion waves"
        titleStyle={styles.headerTitle}
        subtitleStyle={styles.headerSubtitle}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        // `isRefreshing`, not `isFetching`: this spinner belongs to a pull the user
        // actually made, not to every load the screen does on its own.
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FilterRow
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          years={years}
        />

        {loading ? (
          <InsightsStatsSkeleton />
        ) : error ? (
          // A failed month used to render as an empty one -- same blank chart, same
          // zero counts, no way to tell "nothing happened" from "nothing loaded".
          <PixelCard padding={24} style={styles.errorCard}>
            <Text style={styles.errorTitle}>COULD NOT LOAD</Text>
            <Text style={styles.errorText}>
              {(error as Error)?.message ?? 'Something went wrong.'}
            </Text>
            <Pressable
              onPress={refreshStats}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <Text style={styles.retryText}>[ TRY AGAIN ]</Text>
            </Pressable>
          </PixelCard>
        ) : (
          <>
            {/* First on the screen on purpose: the cards below it report the
                month, and this one says the month is survivable before they do. */}
            <MonthlyReassurance
              month={selectedMonth}
              dayEntries={dayEntries}
              totalEntries={filteredTotalEntries}
            />

            <SummaryCards filteredTotalEntries={filteredTotalEntries} />

            <EmotionWavesChart
              chartData={chartData}
              handleDataPointClick={handleDataPointClick}
              isFetching={isFetching}
              hasData={filteredTotalEntries > 0}
            />



            <EmotionBreakdown stats={filteredStats} />
          </>
        )}

        {/* Outside the month's loading/error branches: it has its own query, and a
            month that failed to load says nothing about the goals. */}
        <GoalsProgress
          goals={goalProgress}
          isPending={goalProgressPending}
          onRetry={refetchGoalProgress}
          onAddGoal={() => navigation.navigate('GoalForm', {})}
        />

      </ScrollView>

      <ChartTooltipModal
        visible={tooltipVisible}
        data={tooltipData}
        onClose={() => setTooltipVisible(false)}
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    letterSpacing: 2,
    color: INK,
  },
  headerSubtitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: INK_MUTED,
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  errorCard: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: PIXEL_BOLD,
    color: INK,
    letterSpacing: 2,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    fontFamily: PIXEL,
    color: INK_MUTED,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: PAPER,
    borderWidth: BORDER_W_INNER,
    borderColor: OUTLINE,
  },
  retryButtonPressed: {
    // Sinks toward its own corner, the way every other pixel control answers a press.
    transform: [{ translateX: 1 }, { translateY: 1 }],
    backgroundColor: '#EDE9E0',
  },
  retryText: {
    fontSize: 11,
    fontFamily: PIXEL_BOLD,
    color: INK,
    letterSpacing: 1,
  },
});