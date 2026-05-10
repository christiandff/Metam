import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLastEntryForExercise, saveWorkout, generateId } from '../utils/storage';
import { getSuggestion } from '../utils/progressOverload';
import { colors, spacing } from '../theme';

// ─── Warm-up algorithm ───────────────────────────────────────────────────────
// WU1: 25% of target weight (min 20 kg) × 10 reps
// WU2: 50% of target weight               × 5 reps
// Always returns 2 sets — empty if no target weight yet.
function calcWarmups(targetWeight) {
  const round = v => Math.round(v / 2.5) * 2.5;
  if (targetWeight && targetWeight >= 20) {
    const w1 = Math.max(20, round(targetWeight * 0.25));
    const w2 = round(targetWeight * 0.5);
    return [
      { weight: String(w1), reps: '10', done: false },
      { weight: String(w2), reps: '5',  done: false },
    ];
  }
  // First time — show empty rows, user fills in manually
  return [
    { weight: '', reps: '10', done: false },
    { weight: '', reps: '5',  done: false },
  ];
}

function formatLastEntry(entry) {
  if (!entry || entry.sets.length === 0) return null;
  const sets = entry.sets;
  const avgW = sets.reduce((s, e) => s + e.weight, 0) / sets.length;
  const avgR = Math.round(sets.reduce((s, e) => s + e.reps, 0) / sets.length);
  return `Last: ${avgW % 1 === 0 ? avgW : avgW.toFixed(1)} kg × ${avgR} × ${sets.length} sets`;
}

function makeWorkSets(suggestion) {
  const count = suggestion?.numSets || 3;
  return Array.from({ length: count }, () => ({
    weight: suggestion ? String(suggestion.weight) : '',
    reps:   suggestion ? String(suggestion.reps)   : '',
    done:   false,
  }));
}

// ─── Set Row ─────────────────────────────────────────────────────────────────
function SetRow({ setNum, set, isWarmup, onChangeWeight, onChangeReps, onToggleDone, onRemove }) {
  return (
    <View style={[styles.setRow, isWarmup && styles.setRowWarmup, set.done && styles.setRowDone]}>
      <View style={[styles.setNumWrap, isWarmup && styles.setNumWrapWarmup]}>
        <Text style={[styles.setNumber, isWarmup && styles.setNumberWarmup]}>
          {isWarmup ? `W${setNum}` : setNum}
        </Text>
      </View>
      <TextInput
        style={[styles.input, isWarmup && styles.inputWarmup]}
        value={set.weight}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.suggestion}
        selectTextOnFocus
      />
      <TextInput
        style={[styles.input, isWarmup && styles.inputWarmup]}
        value={set.reps}
        onChangeText={onChangeReps}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.suggestion}
        selectTextOnFocus
      />
      <TouchableOpacity
        style={[styles.doneBtn, set.done && styles.doneBtnActive, isWarmup && styles.doneBtnWarmup]}
        onPress={onToggleDone}
      >
        <Text style={[styles.doneBtnText, set.done && styles.doneBtnTextActive]}>✓</Text>
      </TouchableOpacity>
      {!isWarmup && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.removeWrap}>
          <Text style={styles.removeSet}>×</Text>
        </TouchableOpacity>
      )}
      {isWarmup && <View style={styles.removeWrap} />}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkoutScreen({ route, navigation }) {
  const { program } = route.params;
  const [exerciseStates, setExerciseStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function loadData() {
      const states = await Promise.all(
        program.exercises.map(async ex => {
          const lastEntry = await getLastEntryForExercise(ex.id);
          const suggestion = getSuggestion(lastEntry);
          const warmups = calcWarmups(suggestion?.weight || 0);
          return {
            exerciseId:  ex.id,
            exerciseName: ex.name,
            lastSummary: formatLastEntry(lastEntry),
            suggestion,
            warmupSets: warmups,
            sets: makeWorkSets(suggestion),
          };
        })
      );
      setExerciseStates(states);
      setLoading(false);
    }
    loadData();
  }, []);

  // ── State helpers ────────────────────────────────────────────────────────
  function updateField(exIdx, setIdx, field, value, isWarmup) {
    setExerciseStates(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const key = isWarmup ? 'warmupSets' : 'sets';
      const arr = [...ex[key]];
      arr[setIdx] = { ...arr[setIdx], [field]: value };
      ex[key] = arr;
      next[exIdx] = ex;
      return next;
    });
  }

  function toggleDone(exIdx, setIdx, isWarmup) {
    setExerciseStates(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const key = isWarmup ? 'warmupSets' : 'sets';
      const arr = [...ex[key]];
      arr[setIdx] = { ...arr[setIdx], done: !arr[setIdx].done };
      ex[key] = arr;
      next[exIdx] = ex;
      return next;
    });
  }

  function addSet(exIdx) {
    setExerciseStates(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const last = ex.sets[ex.sets.length - 1];
      ex.sets = [...ex.sets, { weight: last?.weight || '', reps: last?.reps || '', done: false }];
      next[exIdx] = ex;
      return next;
    });
  }

  function removeSet(exIdx, setIdx) {
    setExerciseStates(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      next[exIdx] = ex;
      return next;
    });
  }

  // ── Finish workout ────────────────────────────────────────────────────────
  async function finishWorkout() {
    const workout = {
      id: generateId(),
      date: new Date().toISOString(),
      programId: program.id,
      programName: program.name,
      durationMs: Date.now() - startTime.current,
      exercises: exerciseStates.map(ex => ({
        exerciseId:   ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets
          .filter(s => s.weight !== '' && s.reps !== '')
          .map(s => ({ weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps, 10) || 0 })),
      })).filter(ex => ex.sets.length > 0),
    };

    if (workout.exercises.length === 0) {
      Alert.alert('No sets logged', 'Log at least one set before finishing.');
      return;
    }

    await saveWorkout(workout);
    navigation.replace('SessionSummary', { workout });
  }

  function handleBack() {
    Alert.alert('Leave Workout?', 'Progress will be lost.', [
      { text: 'Stay',  style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtn}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.programName}>{program.name.toUpperCase()}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {exerciseStates.map((ex, exIdx) => (
            <View key={ex.exerciseId} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
              {ex.lastSummary && <Text style={styles.lastSummary}>{ex.lastSummary}</Text>}
              {ex.suggestion && (
                <Text style={[
                  styles.suggestionLabel,
                  ex.suggestion.type === 'weight' && styles.suggestionWeight,
                  ex.suggestion.type === 'reps'   && styles.suggestionReps,
                  ex.suggestion.type === 'hold'   && styles.suggestionHold,
                ]}>
                  {ex.suggestion.label}
                </Text>
              )}

              {/* Column headers */}
              <View style={styles.setHeader}>
                <View style={styles.setNumWrap}><Text style={styles.setHeaderCell}>SET</Text></View>
                <Text style={[styles.setHeaderCell, { flex: 1, textAlign: 'center' }]}>KG</Text>
                <Text style={[styles.setHeaderCell, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                <View style={{ width: 40 }} />
                <View style={{ width: 28 }} />
              </View>

              {/* Warm-up sets */}
              {ex.warmupSets.length > 0 && (
                <>
                  <Text style={styles.warmupLabel}>WARM-UP</Text>
                  {ex.warmupSets.map((set, si) => (
                    <SetRow
                      key={`wu-${si}`}
                      setNum={si + 1}
                      set={set}
                      isWarmup
                      onChangeWeight={v => updateField(exIdx, si, 'weight', v, true)}
                      onChangeReps={v => updateField(exIdx, si, 'reps', v, true)}
                      onToggleDone={() => toggleDone(exIdx, si, true)}
                      onRemove={() => {}}
                    />
                  ))}
                  <Text style={styles.workLabel}>WORKING SETS</Text>
                </>
              )}

              {/* Work sets */}
              {ex.sets.map((set, si) => (
                <SetRow
                  key={`ws-${si}`}
                  setNum={si + 1}
                  set={set}
                  isWarmup={false}
                  onChangeWeight={v => updateField(exIdx, si, 'weight', v, false)}
                  onChangeReps={v => updateField(exIdx, si, 'reps', v, false)}
                  onToggleDone={() => toggleDone(exIdx, si, false)}
                  onRemove={() => removeSet(exIdx, si)}
                />
              ))}

              <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
                <Text style={styles.addSetBtnText}>+ ADD SET</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.finishBtn} activeOpacity={0.85} onPress={finishWorkout}>
            <Text style={styles.finishBtnText}>COMPLETE WORKOUT</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.secondary, fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { color: colors.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, width: 60 },
  programName: { color: colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  exerciseCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.primary, letterSpacing: 0.3 },
  lastSummary: { fontSize: 12, color: colors.secondary },
  suggestionLabel:  { fontSize: 12, fontStyle: 'italic', fontWeight: '600' },
  suggestionWeight: { color: '#4FC3F7' }, // blå → vektøkning
  suggestionReps:   { color: '#81C784' }, // grønn → repøkning
  suggestionHold:   { color: colors.suggestion }, // grå → hold
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setHeaderCell: { fontSize: 10, fontWeight: '700', color: colors.tertiary, letterSpacing: 1.5 },
  warmupLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.suggestion,
    letterSpacing: 2.5,
    marginTop: spacing.xs,
  },
  workLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2.5,
    marginTop: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  setRowWarmup: { opacity: 0.6 },
  setRowDone: { opacity: 0.4 },
  setNumWrap: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 2,
  },
  setNumWrapWarmup: { backgroundColor: 'transparent' },
  setNumber: { fontSize: 11, fontWeight: '700', color: colors.secondary },
  setNumberWarmup: { color: colors.suggestion },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    color: colors.primary,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  inputWarmup: {
    backgroundColor: 'transparent',
    borderColor: colors.tertiary,
    color: colors.secondary,
  },
  doneBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnWarmup: { borderColor: colors.tertiary },
  doneBtnActive: { backgroundColor: colors.success, borderColor: colors.success },
  doneBtnText: { color: colors.secondary, fontSize: 16, fontWeight: '700' },
  doneBtnTextActive: { color: colors.primary },
  removeWrap: { width: 28, alignItems: 'center' },
  removeSet: { color: colors.tertiary, fontSize: 20, fontWeight: '300' },
  addSetBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  addSetBtnText: { color: colors.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  finishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
    marginTop: spacing.md,
  },
  finishBtnText: { color: colors.bg, fontSize: 14, fontWeight: '800', letterSpacing: 3 },
});
