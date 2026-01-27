// src/screens/InsightsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, LoadingState, EmptyState } from '../components';
import { useInsightsController } from '../controllers/useInsightsController';

export default function InsightsScreen({ navigation }: any) {
  const { loading, stats, totalEntries, refreshStats } = useInsightsController();

  return (
    <ScreenContainer>
      <AppHeader
        title="Insights"
        subtitle="Last 30 Days"
      />

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshStats} />}
          showsVerticalScrollIndicator={false}
        >

          {/* Summary Row (Total + Weekly Avg) */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Card padding={16} style={{ flex: 1, alignItems: 'center' }}>
              {/* Added Icon for visual polish */}
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <TrendingUp size={20} color="#4F46E5" />
              </View>
              <Text style={styles.summaryNumber}>{totalEntries}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </Card>

            <Card padding={16} style={{ flex: 1, alignItems: 'center' }}>
              {/* Added Icon for visual polish */}
              <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <Calendar size={20} color="#166534" />
              </View>
              <Text style={styles.summaryNumber}>
                {totalEntries > 0 ? Math.ceil(totalEntries / 4) : 0}
              </Text>
              <Text style={styles.summaryLabel}>Per Week</Text>
            </Card>
          </View>

          {/* Chart Section */}
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color="#1A202C" />
            <Text style={styles.sectionTitle}>Emotion Breakdown</Text>
          </View>

          {stats.map((item) => (
            <Card key={item.label} style={styles.statRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statCount}>{item.count} times</Text>
              </View>

              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${item.percentage}%`, backgroundColor: item.color }
                  ]}
                />
              </View>
            </Card>
          ))}

          {stats.length === 0 && (
            <EmptyState
              title="No data yet"
              subtitle="Check in a few times to see your trends!"
              emoji="📊"
              buttonLabel="Check In Now"
              onButtonPress={() => navigation.navigate('CheckIn')}
            />
          )}

        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  // Added styling for the Icon Box
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  summaryNumber: {
    fontSize: 28, // Adjusted size to fit side-by-side
    fontWeight: '800',
    color: '#1A202C',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  statRow: {
    marginBottom: 16, // Reduced slightly
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  statCount: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
});