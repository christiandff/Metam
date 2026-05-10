import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = '@maleren/workouts';
const CUSTOM_PROGRAMS_KEY = '@maleren/custom_programs';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function getWorkouts() {
  try {
    const json = await AsyncStorage.getItem(WORKOUTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveWorkout(workout) {
  const workouts = await getWorkouts();
  workouts.push(workout);
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

// ─── Custom Programs ─────────────────────────────────────────────────────────

export async function getCustomPrograms() {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_PROGRAMS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveCustomProgram(program) {
  const programs = await getCustomPrograms();
  const idx = programs.findIndex(p => p.id === program.id);
  if (idx >= 0) {
    programs[idx] = program;
  } else {
    programs.push(program);
  }
  await AsyncStorage.setItem(CUSTOM_PROGRAMS_KEY, JSON.stringify(programs));
}

export async function deleteCustomProgram(programId) {
  const programs = await getCustomPrograms();
  const filtered = programs.filter(p => p.id !== programId);
  await AsyncStorage.setItem(CUSTOM_PROGRAMS_KEY, JSON.stringify(filtered));
}

// ─── Exercise History ─────────────────────────────────────────────────────────

export async function getLastEntryForExercise(exerciseId) {
  const workouts = await getWorkouts();
  for (let i = workouts.length - 1; i >= 0; i--) {
    const entry = workouts[i].exercises.find(e => e.exerciseId === exerciseId);
    if (entry && entry.sets.length > 0) {
      return entry;
    }
  }
  return null;
}

export async function updateWorkout(id, updates) {
  const workouts = await getWorkouts();
  const idx = workouts.findIndex(w => w.id === id);
  if (idx >= 0) {
    workouts[idx] = { ...workouts[idx], ...updates };
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  }
}

export async function clearAllData() {
  await AsyncStorage.multiRemove([WORKOUTS_KEY, CUSTOM_PROGRAMS_KEY]);
}

export async function getExerciseHistory(exerciseId) {
  const workouts = await getWorkouts();
  const history = [];
  for (const workout of workouts) {
    const entry = workout.exercises.find(e => e.exerciseId === exerciseId);
    if (entry && entry.sets.length > 0) {
      history.push({ date: workout.date, sets: entry.sets });
    }
  }
  return history;
}
