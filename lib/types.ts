export type Gender = 'male' | 'female'
export type FitnessGoal = 'lose_fat' | 'maintain' | 'build_muscle'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserSettings {
  name: string
  age: number
  weight: number
  height: number
  gender: Gender
  fitnessGoal: FitnessGoal
  activityLevel: ActivityLevel
  experienceLevel: ExperienceLevel
  onboardingComplete: boolean
  profilePicture: string
  calorieGoal: number
  proteinGoal: number
  carbGoal: number
  fatGoal: number
  notifications: {
    workouts: boolean
    meals: boolean
    streaks: boolean
  }
}

export interface FoodItem {
  id: string
  name: string
  servingSize: string
  servingGrams: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface MealEntry {
  id: string
  foodId: string
  name: string
  servingSize: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface DailyNutrition {
  date: string
  meals: {
    breakfast: MealEntry[]
    lunch: MealEntry[]
    dinner: MealEntry[]
    snacks: MealEntry[]
  }
}

export interface RankInfo {
  name: string
  symbol: string
  color: string
  minScore: number
  glowClass: string
}

/** minScore = 0–100 performance score from logged PRs (see performance-rank.ts) */
export const RANKS: RankInfo[] = [
  { name: 'Iron', symbol: 'iron', color: '#9ca3af', minScore: 0, glowClass: 'rank-glow-iron' },
  { name: 'Bronze', symbol: 'bronze', color: '#cd7f32', minScore: 12, glowClass: 'rank-glow-bronze' },
  { name: 'Silver', symbol: 'silver', color: '#c0c0c0', minScore: 25, glowClass: 'rank-glow-silver' },
  { name: 'Gold', symbol: 'gold', color: '#fbbf24', minScore: 38, glowClass: 'rank-glow-gold' },
  { name: 'Platinum', symbol: 'platinum', color: '#67e8f9', minScore: 50, glowClass: 'rank-glow-platinum' },
  { name: 'Diamond', symbol: 'diamond', color: '#38bdf8', minScore: 62, glowClass: 'rank-glow-diamond' },
  { name: 'Master', symbol: 'master', color: '#f87171', minScore: 72, glowClass: 'rank-glow-master' },
  { name: 'Grandmaster', symbol: 'grandmaster', color: '#c084fc', minScore: 82, glowClass: 'rank-glow-grandmaster' },
  { name: 'Elite', symbol: 'elite', color: '#fbbf24', minScore: 90, glowClass: 'rank-glow-elite' },
]

export function getRankByScore(score: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

export function getNextRank(score: number): RankInfo | null {
  const currentRank = getRankByScore(score)
  const currentIndex = RANKS.findIndex(r => r.name === currentRank.name)
  if (currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1]
  }
  return null
}

export function getPointsToNextRank(score: number): number {
  const nextRank = getNextRank(score)
  if (nextRank) {
    return nextRank.minScore - score
  }
  return 0
}

export function formatRankProgress(score: number, pointsToNext: number, nextRank: RankInfo | null): string {
  if (!nextRank) return 'Max rank — keep pushing PRs'
  if (pointsToNext <= 0) return `Ready for ${nextRank.name}`
  return `${pointsToNext} pts to ${nextRank.name} — log stronger PRs`
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: 'User',
  age: 25,
  weight: 70,
  height: 175,
  gender: 'male',
  fitnessGoal: 'build_muscle',
  activityLevel: 'moderate',
  experienceLevel: 'beginner',
  onboardingComplete: false,
  profilePicture: '',
  calorieGoal: 2000,
  proteinGoal: 150,
  carbGoal: 200,
  fatGoal: 65,
  notifications: {
    workouts: true,
    meals: true,
    streaks: true,
  },
}

// Exercise Library Types
export interface Exercise {
  id: string
  name: string
  category: string
  sets: number
  reps: string
  imageUrl: string
}

export interface WorkoutDay {
  day: string
  shortDay: string
  name: string
  color: string
  exercises: Exercise[]
}

// Daily Quest Types
export interface DailyQuest {
  id: string
  title: string
  description: string
  type: 'running' | 'workout'
  xpReward: number
  target: number
  unit: string
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'run-2-miles', title: 'Road Runner', description: 'Run 2 miles today', type: 'running', xpReward: 150, target: 2, unit: 'miles' },
  { id: 'jog-20-min', title: 'Morning Jog', description: 'Do a 20 minute jog', type: 'running', xpReward: 100, target: 20, unit: 'minutes' },
  { id: 'run-5k', title: '5K Challenge', description: 'Complete a 5K run', type: 'running', xpReward: 200, target: 3.1, unit: 'miles' },
  { id: 'walk-10k-steps', title: 'Step Master', description: 'Walk 10,000 steps', type: 'running', xpReward: 100, target: 10000, unit: 'steps' },
  { id: '100-pushups', title: 'Pushup King', description: 'Complete 100 pushups', type: 'workout', xpReward: 150, target: 100, unit: 'reps' },
  { id: 'bench-pr', title: 'Bench Beast', description: 'Hit a new bench PR', type: 'workout', xpReward: 250, target: 1, unit: 'PR' },
  { id: 'full-push-day', title: 'Push Day Hero', description: 'Finish a full Push Day', type: 'workout', xpReward: 200, target: 1, unit: 'workout' },
  { id: '50-pullups', title: 'Pull Power', description: 'Complete 50 pull-ups', type: 'workout', xpReward: 175, target: 50, unit: 'reps' },
  { id: 'leg-day', title: 'Never Skip Legs', description: 'Complete a full Leg Day', type: 'workout', xpReward: 200, target: 1, unit: 'workout' },
  { id: '200-squats', title: 'Squat Master', description: 'Do 200 bodyweight squats', type: 'workout', xpReward: 150, target: 200, unit: 'reps' },
  { id: 'sprint-intervals', title: 'Speed Demon', description: 'Do 8 sprint intervals', type: 'running', xpReward: 175, target: 8, unit: 'intervals' },
  { id: 'core-crusher', title: 'Core Crusher', description: 'Complete 200 ab reps', type: 'workout', xpReward: 125, target: 200, unit: 'reps' },
]

// Friends Types
export interface Friend {
  id: string
  name: string
  friendCode: string
  riseScore: number
  streak: number
  workoutsCompleted?: number
  status: 'pending' | 'accepted'
  addedAt: string
}

export const VIRTUAL_FRIENDS: Record<string, Omit<Friend, 'id' | 'addedAt' | 'status'>> = {
  JAKE8XQR: { name: 'Jake Thompson', friendCode: 'JAKE8XQR', riseScore: 58, streak: 14, workoutsCompleted: 68 },
  SARA2KLP: { name: 'Sarah Chen', friendCode: 'SARA2KLP', riseScore: 76, streak: 21, workoutsCompleted: 110 },
  MIKE5JVT: { name: 'Mike Rodriguez', friendCode: 'MIKE5JVT', riseScore: 32, streak: 5, workoutsCompleted: 29 },
  ALEX9WNB: { name: 'Alex Kim', friendCode: 'ALEX9WNB', riseScore: 88, streak: 45, workoutsCompleted: 203 },
  EMMA3PZS: { name: 'Emma Davis', friendCode: 'EMMA3PZS', riseScore: 18, streak: 3, workoutsCompleted: 12 },
  RYAN7CFX: { name: 'Ryan Lee', friendCode: 'RYAN7CFX', riseScore: 94, streak: 62, workoutsCompleted: 315 },
}

// Body Chart Types
export type MuscleLevel = 'untrained' | 'beginner' | 'intermediate' | 'advanced' | 'elite'

export const MUSCLE_COLORS: Record<MuscleLevel, string> = {
  untrained: '#2a2a2a',
  beginner: '#ef4444',
  intermediate: '#f97316',
  advanced: '#3b82f6',
  elite: '#22c55e',
}

export interface PREntry {
  exerciseId: string
  value: number
}

export interface MuscleGroupPRs {
  [exerciseId: string]: number
}

export interface BodyChartPRs {
  chest: MuscleGroupPRs
  back: MuscleGroupPRs
  shoulders: MuscleGroupPRs
  arms: MuscleGroupPRs
  legs: MuscleGroupPRs
  core: MuscleGroupPRs
}