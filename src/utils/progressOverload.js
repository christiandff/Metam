// ─── Double Progression Model ─────────────────────────────────────────────────
// Target rep range: 8–12 (hypertrophy)
//
// Logic based on last session's average reps:
//   avg >= 12  → increase weight +2.5 kg, drop reps to 8   (weight progression)
//   avg  8–11  → same weight, +1 rep                       (rep progression)
//   avg  <  8  → same weight, same reps                    (consolidate)
//
// This is classic double progression — standard in evidence-based strength training.

const REP_MIN = 8;
const REP_MAX = 12;

export function getSuggestion(lastEntry) {
  if (!lastEntry || !lastEntry.sets || lastEntry.sets.length === 0) return null;

  const validSets = lastEntry.sets.filter(s => s.weight > 0 && s.reps > 0);
  if (validSets.length === 0) return null;

  const avgWeight = validSets.reduce((sum, s) => sum + s.weight, 0) / validSets.length;
  const avgReps   = Math.round(validSets.reduce((sum, s) => sum + s.reps, 0) / validSets.length);
  const round     = v => Math.round(v * 2) / 2; // nearest 0.5 kg

  let weight, reps, type, label;

  if (avgReps >= REP_MAX) {
    // Crushed the rep ceiling → increase weight, reset reps
    weight = round(avgWeight + 2.5);
    reps   = REP_MIN;
    type   = 'weight';
    label  = `↑ Weight: ${weight} kg × ${reps} reps`;
  } else if (avgReps >= REP_MIN) {
    // Within range → push reps up
    weight = round(avgWeight);
    reps   = avgReps + 1;
    type   = 'reps';
    label  = `↑ Reps: ${weight} kg × ${reps} reps`;
  } else {
    // Below range → hold and consolidate
    weight = round(avgWeight);
    reps   = avgReps;
    type   = 'hold';
    label  = `Hold: ${weight} kg × ${reps} reps`;
  }

  return { weight, reps, numSets: lastEntry.sets.length, type, label };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Epley formula for estimated 1RM
export function calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Total volume for a single exercise entry (weight × reps across sets)
export function calcVolume(sets) {
  return sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
}

// Best estimated 1RM across all sets in an entry
export function bestE1RM(sets) {
  return sets.reduce((best, s) => {
    const e = calc1RM(s.weight || 0, s.reps || 0);
    return e > best ? e : best;
  }, 0);
}

// Total workout volume across all exercises
export function totalWorkoutVolume(workout) {
  return workout.exercises.reduce((sum, entry) => sum + calcVolume(entry.sets), 0);
}
