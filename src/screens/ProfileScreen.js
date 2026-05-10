import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { getWorkouts, clearAllData } from '../utils/storage';
import { totalWorkoutVolume, bestE1RM } from '../utils/progressOverload';
import { EXERCISES } from '../data/exercises';
import { colors, spacing } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

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

function formatDate(isoString) {
  const d = new Date(isoString);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function ProfileScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [exerciseStats, setExerciseStats] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const data = await getWorkouts();
    setWorkouts(data);

    // Build per-exercise stats
    const statsMap = {};
    for (const workout of data) {
      for (const entry of workout.exercises) {
        if (!statsMap[entry.exerciseId]) {
          statsMap[entry.exerciseId] = {
            exerciseId: entry.exerciseId,
            name: entry.exerciseName || EXERCISES[entry.exerciseId]?.name || entry.exerciseId,
            sessions: 0,
            bestWeight: 0,
            bestE1RM: 0,
            lastDate: null,
          };
        }
        const stat = statsMap[entry.exerciseId];
        stat.sessions++;
        stat.lastDate = workout.date;
        for (const s of entry.sets) {
          if (s.weight > stat.bestWeight) stat.bestWeight = s.weight;
          const e1 = bestE1RM(entry.sets);
          if (e1 > stat.bestE1RM) stat.bestE1RM = e1;
        }
      }
    }
    setExerciseStats(Object.values(statsMap).sort((a, b) => b.sessions - a.sessions));
  }

  // Volume chart data (last 10 workouts)
  const recentWorkouts = workouts.slice(-10);
  const volumeData = recentWorkouts.map(w => totalWorkoutVolume(w));
  const volumeLabels = recentWorkouts.map(w => formatDate(w.date));

  const totalSessions = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + totalWorkoutVolume(w), 0);
  const totalCardioMin = Math.round(
    workouts.reduce((sum, w) => sum + (w.cardio?.durationSeconds || 0), 0) / 60
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>PROFILE</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Clear All Data',
              'This will delete all workout history and custom programs. Cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllData();
                    loadData();
                  },
                },
              ]
            )
          }
        >
          <Text style={styles.clearBtn}>CLEAR DATA</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats grid 2×2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>SESSIONS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </Text>
            <Text style={styles.statLabel}>TOTAL KG</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{exerciseStats.length}</Text>
            <Text style={styles.statLabel}>EXERCISES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCardioMin}</Text>
            <Text style={styles.statLabel}>CARDIO MIN</Text>
          </View>
        </View>

        {/* Volume progression chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOTAL VOLUME PROGRESSION</Text>
          {volumeData.length >= 2 ? (
            <LineChart
              data={{ labels: volumeLabels, datasets: [{ data: volumeData }] }}
              width={CHART_WIDTH}
              height={180}
              chartConfig={chartConfig}
              bezier
              withInnerLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>Complete 2+ workouts to see progression.</Text>
            </View>
          )}
        </View>

        {/* Exercise list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXERCISE HISTORY</Text>

          {exerciseStats.length === 0 ? (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No workouts logged yet.</Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {exerciseStats.map(stat => (
                <TouchableOpacity
                  key={stat.exerciseId}
                  style={styles.exerciseRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('ExerciseHistory', { exerciseId: stat.exerciseId, exerciseName: stat.name })
                  }
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{stat.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {stat.sessions} session{stat.sessions !== 1 ? 's' : ''}
                      {stat.lastDate ? ` · Last ${formatDate(stat.lastDate)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.exercisePRs}>
                    <Text style={styles.prValue}>{stat.bestWeight} kg</Text>
                    <Text style={styles.prLabel}>BEST</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
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
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 4,
  },
  clearBtn: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 1.5,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flexBasis: '48%',
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
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
  exerciseList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exerciseMeta: {
    fontSize: 11,
    color: colors.secondary,
  },
  exercisePRs: {
    alignItems: 'flex-end',
    gap: 2,
  },
  prValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  prLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1.5,
  },
  chevron: {
    fontSize: 20,
    color: colors.tertiary,
    marginLeft: spacing.xs,
  },
});
