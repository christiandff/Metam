import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { getExerciseHistory } from '../utils/storage';
import { bestE1RM, calcVolume } from '../utils/progressOverload';
import { colors, spacing } from '../theme';

const CHART_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

const chartConfig = {
  backgroundColor: colors.bgCard,
  backgroundGradientFrom: colors.bgCard,
  backgroundGradientTo: colors.bgCard,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: '3', strokeWidth: '1', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeWidth: 1 },
  decimalPlaces: 0,
};

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function ExerciseHistoryScreen({ route, navigation }) {
  const { exerciseId, exerciseName } = route.params;
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getExerciseHistory(exerciseId).then(setHistory);
  }, [exerciseId]);

  const weightData = history.map(h => {
    const maxWeight = Math.max(...h.sets.map(s => s.weight || 0));
    return maxWeight;
  });
  const volumeData = history.map(h => calcVolume(h.sets));
  const e1RMData = history.map(h => bestE1RM(h.sets));
  const labels = history.map(h => formatDate(h.date));

  const hasData = history.length >= 2;

  // Personal records
  const allSets = history.flatMap(h => h.sets);
  const bestWeight = allSets.length ? Math.max(...allSets.map(s => s.weight || 0)) : 0;
  const bestReps = allSets.length ? Math.max(...allSets.map(s => s.reps || 0)) : 0;
  const bestE1 = history.length ? Math.max(...history.map(h => bestE1RM(h.sets))) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtn}>← BACK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        <Text style={styles.sessionCount}>{history.length} sessions logged</Text>

        {/* PRs */}
        <View style={styles.prRow}>
          <View style={styles.prBox}>
            <Text style={styles.prValue}>{bestWeight} kg</Text>
            <Text style={styles.prLabel}>BEST WEIGHT</Text>
          </View>
          <View style={styles.prDivider} />
          <View style={styles.prBox}>
            <Text style={styles.prValue}>{bestReps}</Text>
            <Text style={styles.prLabel}>BEST REPS</Text>
          </View>
          <View style={styles.prDivider} />
          <View style={styles.prBox}>
            <Text style={styles.prValue}>{bestE1} kg</Text>
            <Text style={styles.prLabel}>EST. 1RM</Text>
          </View>
        </View>

        {/* Weight chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>MAX WEIGHT PER SESSION</Text>
          {hasData ? (
            <LineChart
              data={{ labels, datasets: [{ data: weightData }] }}
              width={CHART_WIDTH}
              height={180}
              chartConfig={chartConfig}
              bezier
              withInnerLines={false}
              style={styles.chart}
              yAxisSuffix=" kg"
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>Log 2+ sessions to see the chart.</Text>
            </View>
          )}
        </View>

        {/* Volume chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>VOLUME PER SESSION (KG × REPS)</Text>
          {hasData ? (
            <LineChart
              data={{ labels, datasets: [{ data: volumeData }] }}
              width={CHART_WIDTH}
              height={180}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(180, 180, 180, ${opacity})`,
              }}
              bezier
              withInnerLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>Log 2+ sessions to see the chart.</Text>
            </View>
          )}
        </View>

        {/* Session log */}
        <View style={styles.section}>
          <Text style={styles.chartTitle}>SESSION LOG</Text>
          {history.length === 0 ? (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No sessions yet.</Text>
            </View>
          ) : (
            <View style={styles.logList}>
              {[...history].reverse().map((h, i) => (
                <View key={i} style={styles.logRow}>
                  <Text style={styles.logDate}>{formatDate(h.date)}</Text>
                  <View style={styles.logSets}>
                    {h.sets.map((s, si) => (
                      <Text key={si} style={styles.logSet}>
                        {s.weight} kg × {s.reps}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  sessionCount: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: -spacing.md,
  },
  prRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  prBox: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  prDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  prLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  chartSection: {
    gap: spacing.sm,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 3,
  },
  chart: {
    borderRadius: 4,
    marginLeft: -spacing.md,
  },
  noData: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    color: colors.secondary,
    fontSize: 13,
  },
  section: {
    gap: spacing.md,
  },
  logList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  logDate: {
    fontSize: 12,
    color: colors.secondary,
    width: 48,
    fontWeight: '600',
  },
  logSets: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  logSet: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
});
