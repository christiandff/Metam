export const EXERCISES = {
  incline_bench:       { id: 'incline_bench',       name: 'Incline Bench Press',        category: 'upper' },
  flat_db_bench:       { id: 'flat_db_bench',       name: 'Flat Dumbbell Bench Press',  category: 'upper' },
  chest_row:           { id: 'chest_row',           name: 'Chest-Supported Row',        category: 'upper' },
  lateral_raise:       { id: 'lateral_raise',       name: 'Lateral Raise',              category: 'upper' },
  lat_pulldown:        { id: 'lat_pulldown',        name: 'Lat Pulldown (Wide Grip)',   category: 'upper' },
  triceps_pushdown:    { id: 'triceps_pushdown',    name: 'Triceps Pushdown',           category: 'upper' },
  biceps_curl:         { id: 'biceps_curl',         name: 'Biceps Curl',                category: 'upper' },
  back_squat:          { id: 'back_squat',          name: 'Back Squat',                 category: 'lower' },
  rdl:                 { id: 'rdl',                 name: 'Romanian Deadlift',          category: 'lower' },
  hip_thrust:          { id: 'hip_thrust',          name: 'Barbell Hip Thrust',         category: 'lower' },
  leg_extension:       { id: 'leg_extension',       name: 'Leg Extension',              category: 'lower' },
  leg_curl:            { id: 'leg_curl',            name: 'Lying Leg Curl',             category: 'lower' },
  hip_abduction:       { id: 'hip_abduction',       name: 'Seated Hip Abduction',       category: 'lower' },
  crunch:              { id: 'crunch',              name: 'Crunch / Core Work',         category: 'lower' },
};

export const EXERCISE_LIST = Object.values(EXERCISES);

export const PREDEFINED_PROGRAMS = [
  {
    id: 'upper_body',
    name: 'Upper Body',
    subtitle: 'Jeff Nippard',
    type: 'predefined',
    exerciseIds: [
      'incline_bench',
      'flat_db_bench',
      'chest_row',
      'lateral_raise',
      'lat_pulldown',
      'triceps_pushdown',
      'biceps_curl',
    ],
  },
  {
    id: 'lower_body',
    name: 'Lower Body',
    subtitle: 'Jeff Nippard',
    type: 'predefined',
    exerciseIds: [
      'back_squat',
      'rdl',
      'hip_thrust',
      'leg_extension',
      'leg_curl',
      'hip_abduction',
      'crunch',
    ],
  },
];
