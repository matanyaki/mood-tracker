import React, { useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ScreenContainer, AppHeader, LoadingState } from '../components';
import { useProcessedInsights } from '../hooks/useInsightsQuery';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import { getEmotionColor } from '../constants/colors';

import FilterRow from '../components/Insights/FilterRow';
import SummaryCards from '../components/Insights/SummaryCards';
import EmotionBreakdown from '../components/Insights/EmotionBreakdown';
import EmotionWavesChart from '../components/Insights/EmotionWavesChart';
import ChartTooltipModal from '../components/Insights/ChartTooltipModal';

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

export default function InsightsScreen({ navigation }: any) {
  const { loading, isFetching, entries, refreshStats } = useProcessedInsights();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Tooltip Modal State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ day: number; emotions: { emotion: string; scale: number; note: string }[] } | null>(null);

  // Parse entries to process chart data
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

  // Filter for month and year
  const filteredEntries = (entries || []).filter((entry: any) => {
    if (!entry.date) return false;
    const entryDate = new Date(entry.date);
    return (entryDate.getMonth() + 1).toString() === selectedMonth &&
      entryDate.getFullYear().toString() === selectedYear;
  });

  filteredEntries.forEach((entry: any) => {
    const entryDate = new Date(entry.date);
    const dayIndex = entryDate.getDate() - 1;

    if (entry.emotions && dayIndex >= 0 && dayIndex < daysInMonth) {
      entry.emotions.forEach((eItem: any) => {
        const key = (eItem.id || eItem.label || 'unknown').toLowerCase();
        if (emotionDataMap[key]) {
          if (eItem.scale > emotionDataMap[key][dayIndex].scale) {
            emotionDataMap[key][dayIndex] = {
              scale: eItem.scale,
              note: eItem.note || ''
            };
          }
        }
      });
    }
  });

  // Calculate local Summary and Breakdown stats for the filtered month
  const localCounts: Record<string, number> = {};
  let totalLocalEmotions = 0;

  filteredEntries.forEach((entry: any) => {
    if (entry.emotions && entry.emotions.length > 0) {
      entry.emotions.forEach((eItem: any) => {
        const key = (eItem.id || eItem.label || 'unknown').toLowerCase();
        localCounts[key] = (localCounts[key] || 0) + 1;
        totalLocalEmotions++;
      });
    }
  });

  const filteredStats = EMOTIONS_CONFIG.map(emotion => {
    const count = localCounts[emotion.id] || 0;
    return {
      label: emotion.label,
      count: count,
      color: getEmotionColor(emotion.id),
      percentage: totalLocalEmotions > 0 ? (count / totalLocalEmotions) * 100 : 0
    };
  }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  const filteredTotalEntries = filteredEntries.length;

  // We will manually stack the datasets so react-native-chart-kit can draw them as a Stacked Area.
  // To do this correctly, we accumulate values for each day, and draw the LARGEST (Total) area first,
  // then the next largest on top, and so on.
  
  let runningTotals = Array(daysInMonth).fill(0);
  const stackedDatasets = [];

  // Reverse EMOTIONS_CONFIG so that the first emotion is the "bottom" of the stack.
  const reversedEmotions = [...EMOTIONS_CONFIG].reverse();

  reversedEmotions.forEach((emotion) => {
    const newData = emotionDataMap[emotion.id].map((item, index) => {
      runningTotals[index] += item.scale;
      return runningTotals[index];
    });

    stackedDatasets.unshift({
      emotionKey: emotion.id,
      color: () => getEmotionColor(emotion.id),
      data: [...newData],
      strokeWidth: 2,
      meta: emotionDataMap[emotion.id] // Keep original unstacked metadata for the tooltip
    });
  });

  // Ensure datasets array is what chart-kit expects
  const chartData = {
    labels: labels,
    datasets: stackedDatasets
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()];

  const handleDataPointClick = (data: any) => {
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
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Insights"
        subtitle="Track Your Emotion Waves"
      />

      {loading && !entries?.length ? (
        <LoadingState />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshStats} />}
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
      )}

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