import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateWorkout } from '../utils/storage';
import { colors, spacing } from '../theme';

const CARDIO_TYPES = ['Stairmaster', 'Jogging', 'Cycling', 'Walking'];
const INTENSITIES = ['LOW', 'MEDIUM', 'HIGH'];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CardioScreen({ route, navigation }) {
  const { workoutId } = route.params;

  const [selectedType, setSelectedType] = useState(null);
  const [intensity, setIntensity] = useState('MEDIUM');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function startTimer() {
    if (!selectedType) {
      Alert.alert('Select a cardio type first');
      return;
    }
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }

  function pauseTimer() {
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  function stopTimer() {
    pauseTimer();
    setFinished(true);
  }

  async function saveCardio() {
    if (workoutId) {
      await updateWorkout(workoutId, {
        cardio: {
          type: selectedType,
          intensity,
          durationSeconds: seconds,
        },
      });
    }
    navigation.navigate('Main');
  }

  function skip() {
    navigation.navigate('Main');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipBtn}>SKIP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CARDIO</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Cardio type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT TYPE</Text>
          <View style={styles.typeGrid}>
            {CARDIO_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, selectedType === type && styles.typeBtnActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.typeBtnText, selectedType === type && styles.typeBtnTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensity selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTENSITY</Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[styles.intensityBtn, intensity === lvl && styles.intensityBtnActive]}
                activeOpacity={0.7}
                onPress={() => setIntensity(lvl)}
              >
                <Text style={[styles.intensityText, intensity === lvl && styles.intensityTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          {selectedType && (
            <Text style={styles.timerSub}>
              {selectedType} · {intensity}
            </Text>
          )}
        </View>

        {/* Timer controls */}
        {!finished ? (
          <View style={styles.timerControls}>
            {!running ? (
              <TouchableOpacity style={styles.startBtn} onPress={startTimer} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>{seconds > 0 ? 'RESUME' : 'START'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.pauseBtn} onPress={pauseTimer} activeOpacity={0.85}>
                <Text style={styles.pauseBtnText}>PAUSE</Text>
              </TouchableOpacity>
            )}
            {seconds > 0 && (
              <TouchableOpacity style={styles.stopBtn} onPress={stopTimer} activeOpacity={0.85}>
                <Text style={styles.stopBtnText}>STOP</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.finishedSection}>
            <Text style={styles.finishedLabel}>
              {formatTime(seconds)} · {selectedType} · {intensity}
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={saveCardio} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>SAVE & DONE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardBtn} onPress={skip} activeOpacity={0.7}>
              <Text style={styles.discardBtnText}>DISCARD</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skipBtn: { color: colors.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, width: 40 },
  headerTitle: { color: colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 3,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    backgroundColor: colors.bgCard,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeBtnText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  typeBtnTextActive: { color: colors.bg },
  intensityRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  intensityBtnActive: { backgroundColor: colors.bgInput },
  intensityText: { fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 2 },
  intensityTextActive: { color: colors.primary },
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timer: {
    fontSize: 72,
    fontWeight: '200',
    color: colors.primary,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  timerSub: {
    fontSize: 12,
    color: colors.secondary,
    letterSpacing: 2,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  timerControls: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  startBtnText: { color: colors.bg, fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  pauseBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  pauseBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 3 },
  stopBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 2,
  },
  stopBtnText: { color: colors.danger, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  finishedSection: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  finishedLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.secondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  saveBtnText: { color: colors.bg, fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  discardBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  discardBtnText: { color: colors.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
});
