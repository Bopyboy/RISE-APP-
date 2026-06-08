import { MuscleLevel } from './types'

export type Gender = 'male' | 'female'

export interface StrengthProfile {
  age: number
  weightKg: number
  gender: Gender
}

/**
 * Epley formula: e1RM = weight × (1 + reps / 30)
 * For reps = 1, this returns weight unchanged.
 * Capped at 12 reps for accuracy (beyond that reliability drops).
 */
export function calcE1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  const r = Math.min(reps, 12)
  if (r === 1) return weight
  return Math.round(weight * (1 + r / 30))
}

/** Relative 1RM standards (lift ÷ bodyweight) at reference age 20, male */
const MALE_RATIOS: Record<
  string,
  { unit: 'lbs' | 'reps' | 'sec'; beginner: number; intermediate: number; advanced: number; elite: number; isLower?: boolean; bodyweight?: boolean }
> = {
  // CHEST
  bench:     { unit: 'lbs', beginner: 0.75, intermediate: 1.0,  advanced: 1.25, elite: 1.5  },
  pushup:    { unit: 'reps', beginner: 15,  intermediate: 30,   advanced: 50,   elite: 75,  bodyweight: true },
  incline:   { unit: 'lbs', beginner: 0.55, intermediate: 0.75, advanced: 1.0,  elite: 1.2  },
  dips:      { unit: 'reps', beginner: 8,   intermediate: 15,   advanced: 25,   elite: 40,  bodyweight: true },

  // BACK
  deadlift:  { unit: 'lbs', beginner: 1.0,  intermediate: 1.35, advanced: 1.75, elite: 2.1, isLower: true },
  pullup:    { unit: 'reps', beginner: 3,   intermediate: 8,    advanced: 15,   elite: 22,  bodyweight: true },
  row:       { unit: 'lbs', beginner: 0.55, intermediate: 0.8,  advanced: 1.05, elite: 1.3  },
  latpull:   { unit: 'lbs', beginner: 0.45, intermediate: 0.65, advanced: 0.9,  elite: 1.15 },

  // SHOULDERS
  ohp:       { unit: 'lbs', beginner: 0.4,  intermediate: 0.55, advanced: 0.75, elite: 0.95 },
  lateral:   { unit: 'lbs', beginner: 0.08, intermediate: 0.14, advanced: 0.2,  elite: 0.28 },
  shrug:     { unit: 'lbs', beginner: 0.8,  intermediate: 1.2,  advanced: 1.6,  elite: 2.1  },
  facepull:  { unit: 'lbs', beginner: 0.18, intermediate: 0.28, advanced: 0.4,  elite: 0.55 },

  // ARMS
  curl:      { unit: 'lbs', beginner: 0.28, intermediate: 0.4,  advanced: 0.55, elite: 0.68 },
  hammer:    { unit: 'lbs', beginner: 0.15, intermediate: 0.22, advanced: 0.32, elite: 0.42 },
  pushdown:  { unit: 'lbs', beginner: 0.25, intermediate: 0.38, advanced: 0.55, elite: 0.72 },
  closebench:{ unit: 'lbs', beginner: 0.55, intermediate: 0.75, advanced: 1.0,  elite: 1.25 },

  // LEGS
  squat:     { unit: 'lbs', beginner: 0.9,  intermediate: 1.2,  advanced: 1.55, elite: 1.9, isLower: true },
  rdl:       { unit: 'lbs', beginner: 0.6,  intermediate: 0.9,  advanced: 1.2,  elite: 1.55, isLower: true },
  legpress:  { unit: 'lbs', beginner: 1.2,  intermediate: 1.8,  advanced: 2.5,  elite: 3.2, isLower: true },
  lunge:     { unit: 'lbs', beginner: 0.4,  intermediate: 0.65, advanced: 0.9,  elite: 1.2, isLower: true },

  // CORE
  plank:     { unit: 'sec', beginner: 30,   intermediate: 60,   advanced: 120,  elite: 180 },
  situp:     { unit: 'reps', beginner: 20,  intermediate: 40,   advanced: 65,   elite: 90,  bodyweight: true },
  hangleg:   { unit: 'reps', beginner: 5,   intermediate: 10,   advanced: 18,   elite: 25,  bodyweight: true },
  abwheel:   { unit: 'reps', beginner: 5,   intermediate: 12,   advanced: 20,   elite: 30,  bodyweight: true },
}

export const PR_EXERCISE_GROUPS = {
  chest: [
    { id: 'bench',   name: 'Bench Press' },
    { id: 'pushup',  name: 'Push-ups' },
    { id: 'incline', name: 'Incline Bench' },
    { id: 'dips',    name: 'Dips' },
  ],
  back: [
    { id: 'deadlift', name: 'Deadlift' },
    { id: 'pullup',   name: 'Pull-ups' },
    { id: 'row',      name: 'Barbell Row' },
    { id: 'latpull',  name: 'Lat Pulldown' },
  ],
  shoulders: [
    { id: 'ohp',      name: 'Overhead Press' },
    { id: 'lateral',  name: 'Lateral Raise' },
    { id: 'shrug',    name: 'Barbell Shrug' },
    { id: 'facepull', name: 'Face Pull' },
  ],
  arms: [
    { id: 'curl',       name: 'Barbell Curl' },
    { id: 'hammer',     name: 'Hammer Curl' },
    { id: 'pushdown',   name: 'Tricep Pushdown' },
    { id: 'closebench', name: 'Close-Grip Bench' },
  ],
  legs: [
    { id: 'squat',    name: 'Squat' },
    { id: 'rdl',      name: 'Romanian Deadlift' },
    { id: 'legpress', name: 'Leg Press' },
    { id: 'lunge',    name: 'Lunges' },
  ],
  core: [
    { id: 'plank',   name: 'Plank' },
    { id: 'situp',   name: 'Sit-ups' },
    { id: 'hangleg', name: 'Hanging Leg Raise' },
    { id: 'abwheel', name: 'Ab Wheel' },
  ],
} as const

export type PRGroup = keyof typeof PR_EXERCISE_GROUPS

/** True if this exercise is bodyweight-only (reps/sec, no weight input) */
export function isBodyweightExercise(exerciseId: string): boolean {
  return MALE_RATIOS[exerciseId]?.bodyweight === true || MALE_RATIOS[exerciseId]?.unit === 'sec'
}

/** True if the exercise uses weight input (lbs) so reps matter for e1RM */
export function isWeightedExercise(exerciseId: string): boolean {
  return MALE_RATIOS[exerciseId]?.unit === 'lbs'
}

/** Younger lifters need less absolute weight for the same tier; older slightly more */
export function getAgeFactor(age: number): number {
  if (age < 18) return 1 + (18 - age) * 0.035
  if (age <= 24) return 1
  if (age <= 34) return 1 - (age - 24) * 0.008
  return Math.max(0.88, 1 - (age - 24) * 0.01)
}

function getGenderMultiplier(exerciseId: string, gender: Gender): number {
  if (gender === 'male') return 1
  const spec = MALE_RATIOS[exerciseId]
  if (!spec) return 0.72
  return spec.isLower ? 0.88 : 0.72
}

export function getExerciseSpec(exerciseId: string) {
  return MALE_RATIOS[exerciseId]
}

/** Returns [untrained, beginner, intermediate, advanced, elite] threshold values */
export function getThresholds(exerciseId: string, profile: StrengthProfile): number[] {
  const spec = MALE_RATIOS[exerciseId]
  if (!spec) return [0, 0, 0, 0, 0]

  const ageFactor = getAgeFactor(profile.age)
  const genderMult = getGenderMultiplier(exerciseId, profile.gender)
  const bwLbs = profile.weightKg * 2.20462

  const scale = (ratio: number) => {
    if (spec.unit === 'lbs') {
      return Math.round((bwLbs * ratio * genderMult) / ageFactor / 5) * 5
    }
    if (spec.unit === 'reps' || spec.unit === 'sec') {
      return Math.round((ratio * genderMult) / ageFactor)
    }
    return ratio
  }

  return [
    0,
    scale(spec.beginner),
    scale(spec.intermediate),
    scale(spec.advanced),
    scale(spec.elite),
  ]
}

export function getTierFromValue(value: number, thresholds: number[]): MuscleLevel {
  if (value === 0 || value < thresholds[1]) return 'untrained'
  if (value < thresholds[2]) return 'beginner'
  if (value < thresholds[3]) return 'intermediate'
  if (value < thresholds[4]) return 'advanced'
  return 'elite'
}

export function getTierLabel(level: MuscleLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function getRelativeStrength(value: number, exerciseId: string, profile: StrengthProfile): number | null {
  const spec = MALE_RATIOS[exerciseId]
  if (!spec || value <= 0) return null
  if (spec.unit !== 'lbs') return null
  const bwLbs = profile.weightKg * 2.20462
  return Math.round((value / bwLbs) * 100) / 100
}

export function getStrengthSummary(
  exerciseId: string,
  value: number,
  profile: StrengthProfile
): string {
  const thresholds = getThresholds(exerciseId, profile)
  const tier = getTierFromValue(value, thresholds)
  const rel = getRelativeStrength(value, exerciseId, profile)
  const spec = MALE_RATIOS[exerciseId]
  if (!spec) return getTierLabel(tier)

  if (spec.unit === 'lbs' && rel !== null) {
    return `${getTierLabel(tier)} · ${rel}× bodyweight`
  }
  return getTierLabel(tier)
}