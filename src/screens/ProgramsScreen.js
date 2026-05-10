import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PREDEFINED_PROGRAMS, EXERCISES } from '../data/exercises';
import { getCustomPrograms, deleteCustomProgram } from '../utils/storage';
import { colors, spacing } from '../theme';

function buildExerciseObjects(exerciseIds, customExercises = []) {
  const customMap = Object.fromEntries((customExercises || []).map(e => [e.id, e]));
  return exerciseIds.map(id => EXERCISES[id] || customMap[id] || { id, name: id });
}

export default function ProgramsScreen({ navigation }) {
  const [customPrograms, setCustomPrograms] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getCustomPrograms().then(setCustomPrograms);
    }, [])
  );

  function startWorkout(program) {
    navigation.navigate('Workout', {
      program: {
        ...program,
        exercises: buildExerciseObjects(program.exerciseIds, program.customExercises),
      },
    });
  }

  function handleEdit(program) {
    if (program.type === 'predefined') {
      // Create a custom copy of the predefined program
      navigation.navigate('CustomProgram', {
        program: {
          ...program,
          id: null, // will generate a new id
          type: 'custom',
          name: program.name + ' (Custom)',
        },
      });
    } else {
      navigation.navigate('CustomProgram', { program });
    }
  }

  function handleDeleteCustom(programId) {
    Alert.alert('Delete Program', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomProgram(programId);
          setCustomPrograms(prev => prev.filter(p => p.id !== programId));
        },
      },
    ]);
  }

  function renderProgram({ item }) {
    const isCustom = item.type === 'custom';
    const exercises = buildExerciseObjects(item.exerciseIds, item.customExercises);

    return (
      <View style={styles.programCard}>
        {/* Edit button in corner */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleEdit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editBtnText}>✎</Text>
        </TouchableOpacity>

        <View style={styles.programTitleRow}>
          <Text style={styles.programName}>{item.name}</Text>
          {item.subtitle && (
            <Text style={styles.programSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        <View style={styles.exerciseList}>
          {exercises.map((ex, i) => (
            <Text key={ex.id} style={styles.exerciseItem}>
              {i + 1}. {ex.name}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.8}
            onPress={() => startWorkout(item)}
          >
            <Text style={styles.startBtnText}>START</Text>
          </TouchableOpacity>

          {isCustom && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteCustom(item.id)}
            >
              <Text style={styles.deleteBtnText}>REMOVE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const allPrograms = [...PREDEFINED_PROGRAMS, ...customPrograms];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>PROGRAMS</Text>
        <TouchableOpacity
          style={styles.newBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CustomProgram', { program: null })}
        >
          <Text style={styles.newBtnText}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={allPrograms}
        keyExtractor={item => item.id}
        renderItem={renderProgram}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  newBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 2,
  },
  newBtnText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  programCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.lg,
    gap: spacing.md,
  },
  editBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    backgroundColor: colors.bg,
    zIndex: 1,
  },
  editBtnText: {
    color: colors.secondary,
    fontSize: 14,
  },
  programTitleRow: {
    paddingRight: 36,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  programSubtitle: {
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  exerciseList: {
    gap: 4,
  },
  exerciseItem: {
    fontSize: 13,
    color: colors.secondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  startBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: 2,
  },
  startBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: 2,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
