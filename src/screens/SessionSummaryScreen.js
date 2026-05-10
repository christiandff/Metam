import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWorkouts } from '../utils/storage';
import { totalWorkoutVolume, bestE1RM, calc1RM } from '../utils/progressOverload';
import { quotes } from '../data/quotes';
import { colors, spacing } from '../theme';

function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function pickEndQuote(volume, prCount) {
  if (prCount > 0) return 'Personal records broken. The bar knows who showed up.';
  if (volume > 5000) return 'Progress is a promise you keep with yourself.';
  return 'Every session adds a brick. Keep building.';
}

export default function SessionSummaryScreen({ route, navigation }) {
  const { workout } = route.params;
  const [prs, setPrs] = useState([]);
  const [bestExercise, setBestExercise] = useState(null);
  const [consistencyDays, setConsistencyDays] = useState(0);

  const volume = totalWorkoutVolume(workout);
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const duration = workout.durationMs ? formatDuration(workout.durationMs) : '—';

  useEffect(() => {
    detectPRs();
  }, []);

  async function detectPRs() {
    const allWorkouts = await getWorkouts();
    // Exclude the current workout (last one) for comparison
    const previous = allWorkouts.slice(0, -1);
    const foundPrs = [];

    for (const entry of workout.exercises) {
      const prevEntries = previous
        .flatMap(w => w.exercises.filter(e => e.exerciseId === entry.exerciseId))
        .flatMap(e => e.sets);

      if (prevEntries.length === 0) continue;
      const prevBestWeight = Math.max(...prevEntries.map(s => s.weight));
      const currBestWeight = Math.max(...entry.sets.map(s => s.weight));
      if (currBestWeight > prevBestWeight) {
        foundPrs.push({
          name: entry.exerciseName,
          prev: prevBestWeight,
          current: currBestWeight,
        });
      }
    }
    setPrs(foundPrs);

    // Best exercise by e1RM in this session
    let best = null;
    let bestVal = 0;
    for (const entry of workout.exercises) {
      const e1 = bestE1RM(entry.sets);
      if (e1 > bestVal) { bestVal = e1; best = entry.exerciseName; }
    }
    setBestExercise(best);

    // Consistency: workouts in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = allWorkouts.filter(w => new Date(w.date).getTime() > thirtyDaysAgo);
    setConsistencyDays(recent.length);
  }

  const endQuote = pickEndQuote(volume, prs.length);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.completedLabel}>WORKOUT COMPLETE</Text>
          <Text style={styles.programName}>{workout.programName}</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}
            </Text>
            <Text style={styles.statLabel}>VOLUME KG</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>WORK SETS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consistencyDays}</Text>
            <Text style={styles.statLabel}>SESSIONS / 30D</Text>
          </View>
        </View>

        {/* PRs */}
        {prs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERSONAL RECORDS 🏆</Text>
            {prs.map((pr, i) => (
              <View key={i} style={styles.prRow}>
                <Text style={styles.prName}>{pr.name}</Text>
                <View style={styles.prNumbers}>
                  <Text style={styles.prPrev}>{pr.prev} kg</Text>
                  <Text style={styles.prArrow}>→</Text>
                  <Text style={styles.prNew}>{pr.current} kg</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Best exercise */}
        {bestExercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BEST EXERCISE</Text>
            <View style={styles.bestExerciseCard}>
              <Text style={styles.bestExerciseName}>{bestExercise}</Text>
            </View>
          </View>
        )}

        {/* Next session suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NEXT SESSION</Text>
          <View style={styles.nextCard}>
            {workout.exercises.slice(0, 3).map((ex, i) => {
              const bestSet = ex.sets.reduce((b, s) => s.weight > b.weight ? s : b, { weight: 0, reps: 0 });
              const nextW = Math.round((bestSet.weight + 2.5) * 2) / 2;
              return (
                <View key={i} style={styles.nextRow}>
                  <Text style={styles.nextExName} numberOfLines={1}>{ex.exerciseName}</Text>
                  <Text style={styles.nextSuggestion}>{nextW} kg × {bestSet.reps}</Text>
                </View>
              );
            })}
            {workout.exercises.length > 3 && (
              <Text style={styles.nextMore}>+ {workout.exercises.length - 3} more exercises</Text>
            )}
          </View>
        </View>

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{endQuote}"</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.cardioBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Cardio', { workoutId: workout.id })}
        >
          <Text style={styles.cardioBtnText}>+ ADD CARDIO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  completedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 3,
  },
  programName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
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
    textAlign: 'center',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 3,
  },
  prRow: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 4,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  prNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prPrev: { fontSize: 13, color: colors.secondary },
  prArrow: { fontSize: 13, color: colors.success },
  prNew: { fontSize: 15, fontWeight: '700', color: colors.success },
  bestExerciseCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
  },
  bestExerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  nextCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextExName: {
    fontSize: 13,
    color: colors.secondary,
    flex: 1,
  },
  nextSuggestion: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.suggestion,
    fontStyle: 'italic',
  },
  nextMore: {
    fontSize: 11,
    color: colors.tertiary,
    marginTop: spacing.xs,
  },
  quoteCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.tertiary,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  quoteText: {
    fontSize: 15,
    color: colors.accent,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  cardioBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 2,
  },
  cardioBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  doneBtnText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
