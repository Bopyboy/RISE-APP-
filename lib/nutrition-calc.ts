import { BodyChartPRs, ActivityLevel, ExperienceLevel } from './types'
import { getTierFromValue, getThresholds, PR_EXERCISE_GROUPS, StrengthProfile } from './strength-standards'

export type FitnessGoal = 'lose_fat' | 'maintain' | 'build_muscle'
export type Gender = 'male' | 'female'

export interface MacroTargets {
  calorieGoal: number
  proteinGoal: number
  carbGoal: number
  fatGoal: number
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

/** Activity multipliers based on user-selected activity level */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // desk job, no exercise
  light: 1.375,      // 1-3 days/week
  moderate: 1.55,    // 3-5 days/week
  active: 1.725,     // 6-7 days/week hard
  very_active: 1.9,  // physical job + training
}

/** Legacy: infer training level from logged PRs (0–1 scale) */
export function getTrainingLevel(bodyPRs: BodyChartPRs, profile: StrengthProfile): number {
  const tierScores = { untrained: 0, beginner: 0.25, intermediate: 0.5, advanced: 0.75, elite: 1 }
  let total = 0
  let count = 0

  for (const group of Object.keys(PR_EXERCISE_GROUPS) as (keyof typeof PR_EXERCISE_GROUPS)[]) {
    for (const ex of PR_EXERCISE_GROUPS[group]) {
      const value = bodyPRs[group][ex.id] || 0
      if (value > 0) {
        const thresholds = getThresholds(ex.id, profile)
        const tier = getTierFromValue(value, thresholds)
        total += tierScores[tier]
        count++
      }
    }
  }

  if (count === 0) return 0.35
  return total / count
}

/** Fallback multiplier derived from PRs when activityLevel not set */
export function getActivityMultiplier(trainingLevel: number): number {
  if (trainingLevel < 0.3) return 1.35
  if (trainingLevel < 0.55) return 1.5
  if (trainingLevel < 0.75) return 1.65
  return 1.8
}

export function calculateMacroTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  goal: FitnessGoal,
  bodyPRs: BodyChartPRs,
  activityLevel?: ActivityLevel
): MacroTargets {
  const profile: StrengthProfile = { age, weightKg, gender }
  const bmr = calculateBMR(weightKg, heightCm, age, gender)

  // Use explicit activity level if available, else fall back to PR inference
  const multiplier = activityLevel
    ? ACTIVITY_MULTIPLIERS[activityLevel]
    : getActivityMultiplier(getTrainingLevel(bodyPRs, profile))

  const tdee = Math.round(bmr * multiplier)

  let calories = tdee
  if (goal === 'lose_fat') calories = Math.round(tdee * 0.82)
  if (goal === 'build_muscle') calories = Math.round(tdee * 1.1)

  const proteinPerKg = goal === 'build_muscle' ? 2.2 : goal === 'lose_fat' ? 2.0 : 1.8
  const proteinGoal = Math.round(weightKg * proteinPerKg)
  const proteinCals = proteinGoal * 4

  const fatGoal = Math.round((calories * (goal === 'lose_fat' ? 0.28 : 0.25)) / 9)
  const fatCals = fatGoal * 9

  const carbGoal = Math.max(50, Math.round((calories - proteinCals - fatCals) / 4))

  return { calorieGoal: calories, proteinGoal, carbGoal, fatGoal }
}