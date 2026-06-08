import { BodyChartPRs, MuscleLevel, RankInfo, RANKS } from './types'
import {
  PR_EXERCISE_GROUPS,
  PRGroup,
  getThresholds,
  getTierFromValue,
  StrengthProfile,
} from './strength-standards'

const TIER_SCORES: Record<MuscleLevel, number> = {
  untrained: 0,
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  elite: 100,
}

function getGroupAverageLevel(
  prs: Record<string, number>,
  exercises: { id: string }[],
  profile: StrengthProfile
): MuscleLevel {
  const levels: MuscleLevel[] = []
  for (const ex of exercises) {
    const v = prs[ex.id]
    if (v && v > 0) {
      levels.push(getTierFromValue(v, getThresholds(ex.id, profile)))
    }
  }
  if (levels.length === 0) return 'untrained'

  const tierValues = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
  const avg = levels.reduce((sum, l) => sum + tierValues[l], 0) / levels.length

  if (avg < 0.5) return 'untrained'
  if (avg < 1.5) return 'beginner'
  if (avg < 2.5) return 'intermediate'
  if (avg < 3.5) return 'advanced'
  return 'elite'
}

/** 0–100 strength score from all logged PRs vs personalized standards */
export function calculatePerformanceScore(
  bodyPRs: BodyChartPRs,
  profile: StrengthProfile
): number {
  const groups = Object.keys(PR_EXERCISE_GROUPS) as PRGroup[]
  let total = 0
  let loggedGroups = 0

  for (const group of groups) {
    const groupPrs = bodyPRs[group]
    const hasAny = Object.values(groupPrs).some(v => v > 0)
    if (!hasAny) continue

    const level = getGroupAverageLevel(groupPrs, PR_EXERCISE_GROUPS[group], profile)
    total += TIER_SCORES[level]
    loggedGroups++
  }

  if (loggedGroups === 0) return 0
  return Math.round(total / loggedGroups)
}

export function getRankByPerformance(score: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

export function getNextPerformanceRank(score: number): RankInfo | null {
  const current = getRankByPerformance(score)
  const idx = RANKS.findIndex(r => r.name === current.name)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function getPointsToNextRank(score: number): number {
  const next = getNextPerformanceRank(score)
  return next ? next.minScore - score : 0
}

export function getRankProgressPercent(score: number): number {
  const current = getRankByPerformance(score)
  const next = getNextPerformanceRank(score)
  if (!next) return 100
  const range = next.minScore - current.minScore
  if (range <= 0) return 100
  return Math.min(100, Math.round(((score - current.minScore) / range) * 100))
}

export function getPerformanceLabel(score: number): string {
  if (score === 0) return 'Log PRs to rank up'
  if (score < 25) return 'Building foundation'
  if (score < 50) return 'Solid progress'
  if (score < 75) return 'Strong lifter'
  return 'Elite territory'
}

/** Minimum PRs required to finish onboarding */
export const ONBOARDING_PR_GROUPS = {
  chest: { id: 'bench' as const, name: 'Bench Press', unit: 'lbs' },
  arms: { id: 'curl' as const, name: 'Barbell Curl', unit: 'lbs' },
  legs: { id: 'squat' as const, name: 'Squat', unit: 'lbs' },
}

export function hasRequiredOnboardingPRs(bodyPRs: BodyChartPRs): boolean {
  return (
    (bodyPRs.chest[ONBOARDING_PR_GROUPS.chest.id] ?? 0) > 0 &&
    (bodyPRs.arms[ONBOARDING_PR_GROUPS.arms.id] ?? 0) > 0 &&
    (bodyPRs.legs[ONBOARDING_PR_GROUPS.legs.id] ?? 0) > 0
  )
}
