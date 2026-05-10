import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXERCISE_LIST } from '../data/exercises';
import { saveCustomProgram, generateId } from '../utils/storage';
import { colors, spacing } from '../theme';

export default function CustomProgramScreen({ route, navigation }) {
  const existing = route.params?.program;

  const [name, setName] = useState(existing?.name || '');
  const [selectedIds, setSelectedIds] = useState(new Set(existing?.exerciseIds || []));
  const [customName, setCustomName] = useState('');
  const [customExercises, setCustomExercises] = useState([]);

  function toggleExercise(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addCustomExercise() {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const id = 'custom_' + generateId();
    setCustomExercises(prev => [...prev, { id, name: trimmed }]);
    setSelectedIds(prev => new Set([...prev, id]));
    setCustomName('');
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a program name.');
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert('No exercises', 'Select at least one exercise.');
      return;
    }

    // Build exerciseIds ordered: predefined first, then custom
    const predefinedSelected = EXERCISE_LIST.filter(e => selectedIds.has(e.id)).map(e => e.id);
    const customSelected = customExercises.filter(e => selectedIds.has(e.id)).map(e => e.id);

    const program = {
      id: existing?.id || generateId(),
      name: name.trim(),
      type: 'custom',
      exerciseIds: [...predefinedSelected, ...customSelected],
      // Store custom exercise definitions for lookup
      customExercises,
    };

    await saveCustomProgram(program);
    navigation.goBack();
  }

  // Merge predefined + custom exercises for display
  const allExercises = [...EXERCISE_LIST, ...customExercises];
  const upperBody = allExercises.filter(e => !e.id.startsWith('custom_') && e.category === 'upper');
  const lowerBody = allExercises.filter(e => !e.id.startsWith('custom_') && e.category === 'lower');
  const custom = customExercises;

  function renderExerciseGroup(exercises, title) {
    return (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>{title}</Text>
        {exercises.map(ex => (
          <TouchableOpacity
            key={ex.id}
            style={[styles.exerciseRow, selectedIds.has(ex.id) && styles.exerciseRowSelected]}
            activeOpacity={0.7}
            onPress={() => toggleExercise(ex.id)}
          >
            <View style={[styles.checkbox, selectedIds.has(ex.id) && styles.checkboxSelected]}>
              {selectedIds.has(ex.id) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.exerciseName, selectedIds.has(ex.id) && styles.exerciseNameSelected]}>
              {ex.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtn}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? 'EDIT' : 'NEW'} PROGRAM</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Program name */}
          <View style={styles.nameSection}>
            <Text style={styles.fieldLabel}>PROGRAM NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Push Day"
              placeholderTextColor={colors.secondary}
              returnKeyType="done"
            />
          </View>

          {/* Exercise selection */}
          <Text style={styles.sectionTitle}>SELECT EXERCISES</Text>
          <Text style={styles.selectedCount}>{selectedIds.size} selected</Text>

          {renderExerciseGroup(upperBody, 'UPPER BODY')}
          {renderExerciseGroup(lowerBody, 'LOWER BODY')}
          {custom.length > 0 && renderExerciseGroup(custom, 'CUSTOM')}

          {/* Add custom exercise */}
          <View style={styles.addCustom}>
            <Text style={styles.fieldLabel}>ADD CUSTOM EXERCISE</Text>
            <View style={styles.addCustomRow}>
              <TextInput
                style={styles.customInput}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Exercise name"
                placeholderTextColor={colors.secondary}
                returnKeyType="done"
                onSubmitEditing={addCustomExercise}
              />
              <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomExercise}>
                <Text style={styles.addCustomBtnText}>ADD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  saveBtn: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  nameSection: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2.5,
  },
  nameInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2.5,
    marginBottom: -spacing.md,
  },
  selectedCount: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: -spacing.md,
  },
  group: {
    gap: 1,
  },
  groupTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.tertiary,
    letterSpacing: 3,
    paddingVertical: spacing.xs,
    paddingLeft: 2,
    marginBottom: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    backgroundColor: colors.bgCard,
    marginBottom: 2,
  },
  exerciseRowSelected: {
    borderColor: colors.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: colors.bg,
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 14,
    color: colors.secondary,
    flex: 1,
  },
  exerciseNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  addCustom: {
    gap: spacing.sm,
  },
  addCustomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    color: colors.primary,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  addCustomBtn: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomBtnText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
