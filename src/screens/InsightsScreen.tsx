import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ScreenContainer, AppHeader, LoadingState } from '../components';
import { useInsightsController } from '../controllers/useInsightsController';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import { getEmotionColor } from '../constants/colors';

import FilterRow from '../components/Insights/FilterRow';
import SummaryCards from '../components/Insights/SummaryCards';
import EmotionBreakdown from '../components/Insights/EmotionBreakdown';
import EmotionWavesChart from '../components/Insights/EmotionWavesChart';
import ChartTooltipModal, { TooltipData } from '../components/Insights/ChartTooltipModal';

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

export default function InsightsScreen({ navigation }: any) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const monthParam = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
  const { loading, isFetching, entries, aggregatedEntries, refreshStats } = useInsightsController(monthParam);

  // Tooltip Modal State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // Parse entries to process chart data
  const { chartData, filteredStats, filteredTotalEntries } = useMemo(() => {
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
          const key = (eItem.id || eItem.label || 'unknown').toLowerCase();
          if (emotionDataMap[key]) {
            emotionDataMap[key][dayIndex] = {
              scale: eItem.scale,
              note: eItem.note || ''
            };
          }
        });
      }
    });

    // Calculate local Summary and Breakdown stats for the filtered month using raw entries
    const localCounts: Record<string, number> = {};
    let totalLocalEmotions = 0;

    filteredRaw.forEach((entry: any) => {
      if (entry.emotions && entry.emotions.length > 0) {
        entry.emotions.forEach((eItem: any) => {
          const key = (eItem.id || eItem.label || 'unknown').toLowerCase();
          localCounts[key] = (localCounts[key] || 0) + 1;
          totalLocalEmotions++;
        });
      }
    });

    const stats = EMOTIONS_CONFIG.map(emotion => {
      const count = localCounts[emotion.id] || 0;
      return {
        label: emotion.label,
        count: count,
        color: getEmotionColor(emotion.id),
        percentage: totalLocalEmotions > 0 ? (count / totalLocalEmotions) * 100 : 0
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
      filteredTotalEntries: filteredTotal
    };
  }, [entries, aggregatedEntries, selectedMonth, selectedYear]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()];
  }, []);

  const handleDataPointClick = useCallback((data: any) => {
    // Fallback if data.dataset doesn't have our custom keys
    let datasetMeta = data?.dataset?.meta;
    let emotionKeyAttr = data?.dataset?.emotionKey;

    if (!datasetMeta || !emotionKeyAttr) {
      const datasetRef = chartData.datasets.find(ds => ds.data === data.dataset?.data);
      if (datasetRef) {
        datasetMeta = datasetRef.meta;
        emotionKeyAttr = datasetRef.emotionKey;
      }
    }

    if (!emotionKeyAttr || emotionKeyAttr === 'hidden') return;

    const day = data.index + 1;
    
    // Gather ALL emotions for this day
    const allEmotions = chartData.datasets.map(ds => {
      const metaInfo = ds.meta?.[data.index];
      return {
        emotionKey: ds.emotionKey,
        emotion: ds.emotionKey.charAt(0).toUpperCase() + ds.emotionKey.slice(1),
        scale: metaInfo?.scale || 0,
        note: metaInfo?.note || ""
      };
    }).filter(e => e.scale > 0); // Skip emotions with value 0

    if (allEmotions.length > 0) {
      setTooltipData({
        day: day,
        emotions: allEmotions,
        x: data.x, // Passed from react-native-chart-kit
        y: data.y
      } as any);
      setTooltipVisible(true);
    }
  }, [chartData]);

  return (
    <ScreenContainer>
      <AppHeader
        title="Insights"
        subtitle="Track Your Emotion Waves"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refreshStats(true)} />}
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

        <EmotionWavesChart
          chartData={chartData}
          handleDataPointClick={handleDataPointClick}
          isFetching={isFetching}
          hasData={filteredTotalEntries > 0}
        />

        <SummaryCards filteredTotalEntries={filteredTotalEntries} />

        <EmotionBreakdown stats={filteredStats} />

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
  content: {
    padding: 20,
    paddingBottom: 40,
  }
});