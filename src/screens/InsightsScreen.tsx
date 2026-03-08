import React, { useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ScreenContainer, AppHeader, LoadingState } from '../components';
import { useInsightsController } from '../controllers/useInsightsController';
import { EMOTIONS_CONFIG } from '../constants/emotions';
import { getEmotionColor } from '../constants/colors';

import FilterRow from '../components/Insights/FilterRow';
import SummaryCards from '../components/Insights/SummaryCards';
import EmotionBreakdown from '../components/Insights/EmotionBreakdown';
import EmotionWavesChart from '../components/Insights/EmotionWavesChart';
import ChartTooltipModal from '../components/Insights/ChartTooltipModal';

const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

export default function InsightsScreen({ navigation }: any) {
  const { loading, entries, refreshStats } = useInsightsController();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Tooltip Modal State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ day: number; emotions: { emotion: string; scale: number; note: string }[] } | null>(null);

  // Parse entries to process chart data
  const daysInMonth = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear));

  // Determine label step to prevent overlapping (e.g., skip every 5 days for clarity)
  const labels = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return day % 5 === 0 || day === 1 ? day.toString() : "";
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

  const datasets = EMOTIONS_CONFIG.map((emotion) => {
    return {
      data: emotionDataMap[emotion.id].map(item => item.scale),
      color: () => getEmotionColor(emotion.id),
      strokeWidth: 2,
      emotionKey: emotion.id, // custom prop to identify which emotion was clicked
      meta: emotionDataMap[emotion.id]
    };
  });

  // Hidden dataset to force the Y-Axis to render up to 5 without decimal overlaps
  datasets.unshift({
    data: Array(daysInMonth).fill(5),
    color: () => 'rgba(0,0,0,0)',
    strokeWidth: 0,
    emotionKey: 'hidden',
    meta: Array(daysInMonth).fill({ scale: 0, note: '' }),
    withDots: false
  } as any);

  const chartData = {
    labels: labels,
    datasets: datasets
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

    if (data.value > 0) {
      const day = data.index + 1;
      const metaInfo = datasetMeta?.[data.index];

      setTooltipData({
        day: day,
        emotions: [{
          emotion: emotionKeyAttr.charAt(0).toUpperCase() + emotionKeyAttr.slice(1),
          scale: data.value,
          note: metaInfo?.note || "No note provided"
        }]
      });
      setTooltipVisible(true);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Insights"
        subtitle="Track Your Emotion Waves"
      />

      {loading ? (
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