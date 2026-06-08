import { BodyChartPRs, WorkoutDay } from './types'
import { DEFAULT_WORKOUT_SPLIT } from './exercise-data'
import { FOOD_DATABASE } from './food-data'
import { calculateMacroTargets, FitnessGoal, Gender, MacroTargets } from './nutrition-calc'
import {
  getTierFromValue,
  getThresholds,
  PR_EXERCISE_GROUPS,
  StrengthProfile,
} from './strength-standards'

export interface PersonalizedWorkoutDay {
  day: string
  name: string
  focus: string
  exercises: { name: string; sets: number; reps: string; note?: string }[]
}

export interface MealPlanSlot {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface DayMealPlan {
  day: string
  breakfast: MealPlanSlot
  lunch: MealPlanSlot
  dinner: MealPlanSlot
  snacks: MealPlanSlot
  totals: { calories: number; protein: number; carbs: number; fats: number }
}

export interface FitnessPlanBundle {
  trainingLevel: string
  splitType: string
  workoutDays: PersonalizedWorkoutDay[]
  macros: MacroTargets
  weeklyMeals: DayMealPlan[]
  calorieNote: string
  workoutNote: string
}

function getOverallTier(bodyPRs: BodyChartPRs, profile: StrengthProfile): number {
  const tierScores = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
  let total = 0
  let count = 0
  for (const group of Object.keys(PR_EXERCISE_GROUPS) as (keyof typeof PR_EXERCISE_GROUPS)[]) {
    for (const ex of PR_EXERCISE_GROUPS[group]) {
      const v = bodyPRs[group][ex.id] || 0
      if (v > 0) {
        total += tierScores[getTierFromValue(v, getThresholds(ex.id, profile))]
        count++
      }
    }
  }
  return count ? total / count : 1
}

function volumeForTier(tier: number): { sets: number; reps: string } {
  if (tier < 1.2) return { sets: 3, reps: '12-15' }
  if (tier < 2.2) return { sets: 4, reps: '8-12' }
  if (tier < 3.2) return { sets: 4, reps: '6-10' }
  return { sets: 5, reps: '4-8' }
}

function customizeDay(day: WorkoutDay, tier: number, goal: FitnessGoal): PersonalizedWorkoutDay {
  const vol = volumeForTier(tier)
  const exercises = day.exercises.slice(0, 5).map(ex => ({
    name: ex.name,
    sets: goal === 'lose_fat' ? Math.max(3, vol.sets - 1) : vol.sets,
    reps: vol.reps,
    note: undefined as string | undefined,
  }))

  if (exercises.length === 0) {
    exercises.push(
      { name: 'Compound Push', sets: vol.sets, reps: vol.reps },
      { name: 'Compound Pull', sets: vol.sets, reps: vol.reps },
      { name: 'Leg Press or Squat', sets: vol.sets, reps: vol.reps }
    )
  }

  return {
    day: day.day,
    name: day.name,
    focus: day.name,
    exercises,
  }
}

export function generateFitnessPlan(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  goal: FitnessGoal,
  bodyPRs: BodyChartPRs,
  workoutSplit: WorkoutDay[]
): FitnessPlanBundle {
  const profile: StrengthProfile = { age, weightKg, gender }
  const tier = getOverallTier(bodyPRs, profile)
  const macros = calculateMacroTargets(weightKg, heightCm, age, gender, goal, bodyPRs)

  const trainingLabel =
    tier < 1.2 ? 'Beginner' : tier < 2.2 ? 'Intermediate' : tier < 3.2 ? 'Advanced' : 'Elite'

  const splitType =
    tier < 1.5
      ? 'Full-body focus (3–4 days)'
      : tier < 2.5
        ? 'Upper / Lower split'
        : 'Push / Pull / Legs'

  const activeDays = workoutSplit.filter(d => d.exercises.length > 0 || d.name !== 'Rest')
  const source = activeDays.length >= 3 ? activeDays : DEFAULT_WORKOUT_SPLIT.filter(d => d.name !== 'Rest')

  const workoutDays = source.slice(0, 5).map(d => customizeDay(d, tier, goal))

  const weeklyMeals = buildWeeklyMealPlan(macros, goal)

  const calorieNote =
    goal === 'lose_fat'
      ? `Cutting ~${Math.round(macros.calorieGoal)} kcal/day based on your weight, age, and training level.`
      : goal === 'build_muscle'
        ? `Surplus ~${macros.calorieGoal} kcal/day to support muscle gain at your current strength.`
        : `Maintenance ~${macros.calorieGoal} kcal/day tuned to your stats.`

  const workoutNote =
    tier < 1.2
      ? 'Higher reps, moderate volume — build form and consistency first.'
      : tier < 2.5
        ? 'Balanced volume — progressive overload on your main lifts.'
        : 'Heavier loads, longer rest — built around your logged PRs.'

  return {
    trainingLevel: trainingLabel,
    splitType,
    workoutDays,
    macros,
    weeklyMeals,
    calorieNote,
    workoutNote,
  }
}

// ─── Real meal templates ────────────────────────────────────────────────────
// Each template has base macros for a "medium" person (~75 kg, ~2000 kcal goal).
// We scale every macro proportionally to the person's actual calorie target.

interface MealTemplate {
  name: string
  baseCalories: number
  baseProtein: number
  baseCarbs: number
  baseFats: number
}

// BREAKFAST — actual breakfast foods
const BREAKFASTS_MUSCLE: MealTemplate[] = [
  { name: 'Scrambled eggs, toast & orange juice', baseCalories: 520, baseProtein: 32, baseCarbs: 52, baseFats: 18 },
  { name: 'Greek yogurt parfait with granola & berries', baseCalories: 480, baseProtein: 28, baseCarbs: 58, baseFats: 12 },
  { name: 'Protein pancakes with maple syrup & banana', baseCalories: 560, baseProtein: 38, baseCarbs: 65, baseFats: 14 },
  { name: 'Bagel with smoked salmon & cream cheese', baseCalories: 510, baseProtein: 30, baseCarbs: 50, baseFats: 16 },
  { name: 'Oatmeal with peanut butter, banana & honey', baseCalories: 540, baseProtein: 22, baseCarbs: 72, baseFats: 16 },
  { name: 'Breakfast burrito with eggs, cheese & salsa', baseCalories: 580, baseProtein: 34, baseCarbs: 55, baseFats: 22 },
  { name: 'French toast with eggs & strawberries', baseCalories: 500, baseProtein: 26, baseCarbs: 60, baseFats: 16 },
]

const BREAKFASTS_FAT_LOSS: MealTemplate[] = [
  { name: 'Veggie egg white omelette with whole grain toast', baseCalories: 320, baseProtein: 28, baseCarbs: 28, baseFats: 8 },
  { name: 'Greek yogurt with mixed berries & chia seeds', baseCalories: 280, baseProtein: 22, baseCarbs: 30, baseFats: 6 },
  { name: 'Overnight oats with almond milk & blueberries', baseCalories: 340, baseProtein: 18, baseCarbs: 48, baseFats: 8 },
  { name: 'Cottage cheese bowl with pineapple & flaxseed', baseCalories: 290, baseProtein: 26, baseCarbs: 28, baseFats: 5 },
  { name: 'Avocado toast with poached eggs & tomato', baseCalories: 370, baseProtein: 20, baseCarbs: 32, baseFats: 18 },
  { name: 'Protein smoothie with spinach, banana & almond milk', baseCalories: 300, baseProtein: 28, baseCarbs: 34, baseFats: 5 },
  { name: 'Whole grain cereal with skim milk & sliced banana', baseCalories: 310, baseProtein: 14, baseCarbs: 52, baseFats: 4 },
]

const BREAKFASTS_MAINTAIN: MealTemplate[] = [
  { name: 'Eggs & avocado toast with everything bagel seasoning', baseCalories: 430, baseProtein: 22, baseCarbs: 38, baseFats: 20 },
  { name: 'Smoothie bowl with granola, kiwi & coconut flakes', baseCalories: 420, baseProtein: 18, baseCarbs: 60, baseFats: 12 },
  { name: 'Whole grain waffles with eggs & fresh fruit', baseCalories: 460, baseProtein: 20, baseCarbs: 62, baseFats: 14 },
  { name: 'Greek yogurt with walnuts, honey & mixed berries', baseCalories: 400, baseProtein: 20, baseCarbs: 44, baseFats: 16 },
  { name: 'Oatmeal with almond butter & sliced apple', baseCalories: 440, baseProtein: 16, baseCarbs: 58, baseFats: 16 },
  { name: 'Breakfast sandwich with egg, cheese & turkey', baseCalories: 450, baseProtein: 28, baseCarbs: 42, baseFats: 16 },
  { name: 'Açaí bowl with banana, granola & honey', baseCalories: 410, baseProtein: 10, baseCarbs: 70, baseFats: 12 },
]

// LUNCH — real lunch meals
const LUNCHES_MUSCLE: MealTemplate[] = [
  { name: 'Grilled chicken sandwich with fries', baseCalories: 780, baseProtein: 48, baseCarbs: 82, baseFats: 24 },
  { name: 'Beef & rice burrito bowl with guacamole', baseCalories: 820, baseProtein: 50, baseCarbs: 85, baseFats: 28 },
  { name: 'Turkey & cheese sub with pasta salad', baseCalories: 760, baseProtein: 44, baseCarbs: 78, baseFats: 26 },
  { name: 'Tuna melt on sourdough with tomato soup', baseCalories: 700, baseProtein: 46, baseCarbs: 72, baseFats: 22 },
  { name: 'Steak quesadilla with sour cream & salsa', baseCalories: 800, baseProtein: 52, baseCarbs: 70, baseFats: 30 },
  { name: 'Salmon rice bowl with edamame & soy sauce', baseCalories: 740, baseProtein: 50, baseCarbs: 76, baseFats: 20 },
  { name: 'BBQ chicken wrap with coleslaw & sweet potato fries', baseCalories: 790, baseProtein: 46, baseCarbs: 84, baseFats: 26 },
]

const LUNCHES_FAT_LOSS: MealTemplate[] = [
  { name: 'Grilled chicken salad with lemon vinaigrette', baseCalories: 420, baseProtein: 42, baseCarbs: 18, baseFats: 18 },
  { name: 'Turkey lettuce wraps with hummus & veggies', baseCalories: 380, baseProtein: 36, baseCarbs: 22, baseFats: 14 },
  { name: 'Tuna & white bean salad with whole grain crackers', baseCalories: 400, baseProtein: 38, baseCarbs: 28, baseFats: 12 },
  { name: 'Chicken & veggie stir-fry with cauliflower rice', baseCalories: 390, baseProtein: 40, baseCarbs: 24, baseFats: 12 },
  { name: 'Shrimp & avocado salad with lime dressing', baseCalories: 360, baseProtein: 32, baseCarbs: 16, baseFats: 18 },
  { name: 'Lentil & vegetable soup with whole grain bread', baseCalories: 410, baseProtein: 24, baseCarbs: 52, baseFats: 8 },
  { name: 'Greek salad with grilled chicken & feta', baseCalories: 430, baseProtein: 38, baseCarbs: 18, baseFats: 20 },
]

const LUNCHES_MAINTAIN: MealTemplate[] = [
  { name: 'Chicken Caesar wrap with fruit cup', baseCalories: 580, baseProtein: 38, baseCarbs: 56, baseFats: 20 },
  { name: 'Poke bowl with salmon, rice & cucumber', baseCalories: 560, baseProtein: 36, baseCarbs: 60, baseFats: 16 },
  { name: 'BLT sandwich with tomato soup', baseCalories: 550, baseProtein: 24, baseCarbs: 58, baseFats: 22 },
  { name: 'Chicken & veggie pasta with marinara', baseCalories: 590, baseProtein: 36, baseCarbs: 68, baseFats: 16 },
  { name: 'Sushi rolls with miso soup & edamame', baseCalories: 520, baseProtein: 28, baseCarbs: 72, baseFats: 10 },
  { name: 'Falafel wrap with tzatziki & tabbouleh', baseCalories: 560, baseProtein: 20, baseCarbs: 72, baseFats: 20 },
  { name: 'Club sandwich with sweet potato fries', baseCalories: 600, baseProtein: 32, baseCarbs: 62, baseFats: 24 },
]

// DINNER — real dinner meals
const DINNERS_MUSCLE: MealTemplate[] = [
  { name: 'Grilled salmon with roasted potatoes & asparagus', baseCalories: 680, baseProtein: 50, baseCarbs: 52, baseFats: 24 },
  { name: 'Pasta bolognese with garlic bread', baseCalories: 720, baseProtein: 44, baseCarbs: 78, baseFats: 22 },
  { name: 'BBQ ribs with mac & cheese & cornbread', baseCalories: 800, baseProtein: 52, baseCarbs: 70, baseFats: 32 },
  { name: 'Chicken stir-fry with lo mein noodles', baseCalories: 700, baseProtein: 48, baseCarbs: 74, baseFats: 20 },
  { name: 'Steak with baked potato & steamed broccoli', baseCalories: 740, baseProtein: 58, baseCarbs: 56, baseFats: 26 },
  { name: 'Shrimp tacos with rice, beans & guacamole', baseCalories: 720, baseProtein: 44, baseCarbs: 78, baseFats: 22 },
  { name: 'Teriyaki chicken bowl with white rice & bok choy', baseCalories: 680, baseProtein: 50, baseCarbs: 72, baseFats: 16 },
]

const DINNERS_FAT_LOSS: MealTemplate[] = [
  { name: 'Baked cod with roasted veggies & quinoa', baseCalories: 420, baseProtein: 42, baseCarbs: 38, baseFats: 10 },
  { name: 'Turkey meatballs with zucchini noodles & marinara', baseCalories: 400, baseProtein: 44, baseCarbs: 22, baseFats: 14 },
  { name: 'Grilled chicken with sweet potato & green beans', baseCalories: 430, baseProtein: 46, baseCarbs: 36, baseFats: 8 },
  { name: 'Shrimp & veggie stir-fry with brown rice', baseCalories: 410, baseProtein: 38, baseCarbs: 42, baseFats: 8 },
  { name: 'Chicken tikka masala with cauliflower rice', baseCalories: 390, baseProtein: 44, baseCarbs: 20, baseFats: 14 },
  { name: 'Lemon herb salmon with steamed broccoli & quinoa', baseCalories: 440, baseProtein: 46, baseCarbs: 34, baseFats: 14 },
  { name: 'Lean beef & veggie soup with whole grain bread', baseCalories: 380, baseProtein: 36, baseCarbs: 36, baseFats: 10 },
]

const DINNERS_MAINTAIN: MealTemplate[] = [
  { name: 'Grilled chicken with roasted potatoes & salad', baseCalories: 570, baseProtein: 44, baseCarbs: 50, baseFats: 18 },
  { name: 'Spaghetti with meat sauce & garlic bread', baseCalories: 620, baseProtein: 34, baseCarbs: 72, baseFats: 20 },
  { name: 'Salmon with wild rice pilaf & roasted carrots', baseCalories: 580, baseProtein: 44, baseCarbs: 52, baseFats: 20 },
  { name: 'Chicken tacos with black beans, salsa & guac', baseCalories: 590, baseProtein: 38, baseCarbs: 60, baseFats: 20 },
  { name: 'Pork tenderloin with mashed potatoes & green beans', baseCalories: 560, baseProtein: 42, baseCarbs: 50, baseFats: 18 },
  { name: 'Veggie & tofu fried rice with egg rolls', baseCalories: 550, baseProtein: 26, baseCarbs: 70, baseFats: 16 },
  { name: 'Pizza with grilled chicken, veggies & side salad', baseCalories: 600, baseProtein: 36, baseCarbs: 62, baseFats: 22 },
]

// SNACKS — goal-appropriate snacks
const SNACKS_MUSCLE: MealTemplate[] = [
  { name: 'Protein shake with whole milk & banana', baseCalories: 380, baseProtein: 36, baseCarbs: 44, baseFats: 8 },
  { name: 'PB&J sandwich & glass of milk', baseCalories: 400, baseProtein: 18, baseCarbs: 52, baseFats: 16 },
  { name: 'Trail mix with dark chocolate & string cheese', baseCalories: 360, baseProtein: 14, baseCarbs: 38, baseFats: 18 },
  { name: 'Rice cakes with almond butter & honey', baseCalories: 320, baseProtein: 10, baseCarbs: 46, baseFats: 12 },
  { name: 'Cottage cheese with pineapple & walnuts', baseCalories: 300, baseProtein: 24, baseCarbs: 28, baseFats: 10 },
  { name: 'Beef jerky, crackers & apple', baseCalories: 340, baseProtein: 22, baseCarbs: 40, baseFats: 10 },
  { name: 'Greek yogurt with granola & mixed berries', baseCalories: 320, baseProtein: 20, baseCarbs: 42, baseFats: 8 },
]

const SNACKS_FAT_LOSS: MealTemplate[] = [
  { name: 'Apple slices with almond butter', baseCalories: 180, baseProtein: 4, baseCarbs: 24, baseFats: 8 },
  { name: 'Celery & carrots with hummus', baseCalories: 140, baseProtein: 6, baseCarbs: 16, baseFats: 6 },
  { name: 'Hard boiled eggs & cherry tomatoes', baseCalories: 160, baseProtein: 14, baseCarbs: 6, baseFats: 9 },
  { name: 'Low-fat cottage cheese & cucumber', baseCalories: 150, baseProtein: 18, baseCarbs: 8, baseFats: 2 },
  { name: 'Protein bar (low sugar)', baseCalories: 200, baseProtein: 20, baseCarbs: 18, baseFats: 7 },
  { name: 'Edamame with sea salt', baseCalories: 170, baseProtein: 14, baseCarbs: 14, baseFats: 6 },
  { name: 'Rice cakes with turkey & mustard', baseCalories: 160, baseProtein: 14, baseCarbs: 16, baseFats: 3 },
]

const SNACKS_MAINTAIN: MealTemplate[] = [
  { name: 'Mixed nuts & dried cranberries', baseCalories: 240, baseProtein: 6, baseCarbs: 24, baseFats: 14 },
  { name: 'Cheese & whole grain crackers', baseCalories: 220, baseProtein: 10, baseCarbs: 22, baseFats: 12 },
  { name: 'Greek yogurt with honey', baseCalories: 200, baseProtein: 16, baseCarbs: 26, baseFats: 4 },
  { name: 'Peanut butter & banana on toast', baseCalories: 280, baseProtein: 10, baseCarbs: 38, baseFats: 10 },
  { name: 'Smoothie with fruit, yogurt & oats', baseCalories: 260, baseProtein: 14, baseCarbs: 42, baseFats: 4 },
  { name: 'Dark chocolate & almonds', baseCalories: 230, baseProtein: 6, baseCarbs: 22, baseFats: 14 },
  { name: 'Avocado on toast with everything seasoning', baseCalories: 250, baseProtein: 6, baseCarbs: 28, baseFats: 14 },
]

function scaleMeal(template: MealTemplate, targetCalories: number): MealPlanSlot {
  const scale = targetCalories / template.baseCalories
  return {
    name: template.name,
    calories: Math.round(template.baseCalories * scale),
    protein: Math.round(template.baseProtein * scale),
    carbs: Math.round(template.baseCarbs * scale),
    fats: Math.round(template.baseFats * scale),
  }
}

function buildWeeklyMealPlan(macros: MacroTargets, goal: FitnessGoal): DayMealPlan[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Calorie split across meals — snacks smaller for fat loss
  const calSplit =
    goal === 'lose_fat'
      ? { breakfast: 0.27, lunch: 0.35, dinner: 0.32, snacks: 0.06 }
      : goal === 'build_muscle'
        ? { breakfast: 0.26, lunch: 0.32, dinner: 0.28, snacks: 0.14 }
        : { breakfast: 0.27, lunch: 0.33, dinner: 0.30, snacks: 0.10 }

  const breakfastPool =
    goal === 'lose_fat' ? BREAKFASTS_FAT_LOSS :
    goal === 'build_muscle' ? BREAKFASTS_MUSCLE :
    BREAKFASTS_MAINTAIN

  const lunchPool =
    goal === 'lose_fat' ? LUNCHES_FAT_LOSS :
    goal === 'build_muscle' ? LUNCHES_MUSCLE :
    LUNCHES_MAINTAIN

  const dinnerPool =
    goal === 'lose_fat' ? DINNERS_FAT_LOSS :
    goal === 'build_muscle' ? DINNERS_MUSCLE :
    DINNERS_MAINTAIN

  const snackPool =
    goal === 'lose_fat' ? SNACKS_FAT_LOSS :
    goal === 'build_muscle' ? SNACKS_MUSCLE :
    SNACKS_MAINTAIN

  return days.map((day, di) => {
    const breakfast = scaleMeal(breakfastPool[di % breakfastPool.length], Math.round(macros.calorieGoal * calSplit.breakfast))
    const lunch = scaleMeal(lunchPool[di % lunchPool.length], Math.round(macros.calorieGoal * calSplit.lunch))
    const dinner = scaleMeal(dinnerPool[di % dinnerPool.length], Math.round(macros.calorieGoal * calSplit.dinner))
    const snacks = scaleMeal(snackPool[di % snackPool.length], Math.round(macros.calorieGoal * calSplit.snacks))

    return {
      day,
      breakfast,
      lunch,
      dinner,
      snacks,
      totals: {
        calories: breakfast.calories + lunch.calories + dinner.calories + snacks.calories,
        protein: breakfast.protein + lunch.protein + dinner.protein + snacks.protein,
        carbs: breakfast.carbs + lunch.carbs + dinner.carbs + snacks.carbs,
        fats: breakfast.fats + lunch.fats + dinner.fats + snacks.fats,
      },
    }
  })
}