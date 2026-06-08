'use client'

// lib/app-context.tsx
// Replaces all localStorage with Supabase.
// Keeps the exact same AppState interface so every component works unchanged.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import {
  UserSettings,
  DailyNutrition,
  MealEntry,
  DEFAULT_SETTINGS,
  WorkoutDay,
  DailyQuest,
  DAILY_QUESTS,
  BodyChartPRs,
  Friend,
} from './types'
import { DEFAULT_WORKOUT_SPLIT } from './exercise-data'
import { calculateMacroTargets } from './nutrition-calc'
import { calculatePerformanceScore } from './performance-rank'

// ── Helpers ──────────────────────────────────────────────────────────────────

const getTodayString = () => new Date().toISOString().split('T')[0]

const getEmptyNutrition = (): DailyNutrition => ({
  date: getTodayString(),
  meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
})

const getEmptyPRs = (): BodyChartPRs => ({
  chest: {}, back: {}, shoulders: {}, arms: {}, legs: {}, core: {},
})

function getDailyQuest(dateString: string): DailyQuest {
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0)
  return DAILY_QUESTS[seed % DAILY_QUESTS.length]
}

// ── State types ───────────────────────────────────────────────────────────────

interface QuestState {
  quest: DailyQuest
  progress: number
  completed: boolean
  assignedDate: string
}

type AddFriendResult = 'success' | 'already_added' | 'not_found' | 'self'

interface AppState {
  // Auth
  user: User | null
  isAuthLoading: boolean
  signOut: () => Promise<void>

  // App data
  settings: UserSettings
  isLoaded: boolean
  riseScore: number
  streak: number
  nutrition: DailyNutrition
  workoutSplit: WorkoutDay[]
  questState: QuestState | null
  bodyPRs: BodyChartPRs
  friends: Friend[]
  friendCode: string
  coins: number
  ownedItems: string[]
  equippedItems: Record<string, string>

  // Actions (same API as before)
  addCoins: (amount: number) => void
  buyItem: (itemId: string, cost: number) => void
  equipItem: (itemId: string, type: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  getPerformanceScore: () => number
  completeOnboarding: (
    profile: {
      name: string
      age: number
      weight: number
      height: number
      gender: UserSettings['gender']
      fitnessGoal: UserSettings['fitnessGoal']
    },
    initialPRs?: {
      chest?: Record<string, number>
      arms?: Record<string, number>
      legs?: Record<string, number>
    }
  ) => void
  recalculateGoals: () => void
  addRiseScore: (points: number) => void
  addMealEntry: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entry: MealEntry) => void
  removeMealEntry: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entryId: string) => void
  getTodayTotals: () => { calories: number; protein: number; carbs: number; fats: number }
  addExerciseToDay: (dayIndex: number, exercise: import('./types').Exercise) => void
  removeExerciseFromDay: (dayIndex: number, exerciseId: string) => void
  updateExercise: (dayIndex: number, exerciseId: string, updates: Partial<import('./types').Exercise>) => void
  updateQuestProgress: (progress: number) => void
  completeQuest: () => void
  updateBodyPR: (group: keyof BodyChartPRs, exerciseId: string, value: number) => void
  resetAllPRs: () => void
  addFriend: (code: string) => Promise<AddFriendResult>
  removeFriend: (id: string) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // App data
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [riseScore, setRiseScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [nutrition, setNutrition] = useState<DailyNutrition>(getEmptyNutrition())
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutDay[]>(DEFAULT_WORKOUT_SPLIT)
  const [questState, setQuestState] = useState<QuestState | null>(null)
  const [bodyPRs, setBodyPRs] = useState<BodyChartPRs>(getEmptyPRs())
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendCode, setFriendCode] = useState<string>('')
  const [coins, setCoins] = useState(0)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // ── Watch auth state ──────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load all data once user is known ─────────────────────────────────────

  const loadUserData = useCallback(async (uid: string) => {
    setIsLoaded(false)
    const today = getTodayString()

    // Update streak on the server and get fresh value
    const { data: streakData } = await supabase.rpc('update_streak', { p_user_id: uid })

    // 1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()

    if (profile) {
      setSettings({
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        fitnessGoal: profile.fitness_goal,
        profilePicture: profile.profile_picture,
        calorieGoal: profile.calorie_goal,
        proteinGoal: profile.protein_goal,
        carbGoal: profile.carb_goal,
        fatGoal: profile.fat_goal,
        notifications: profile.notifications,
        onboardingComplete: profile.onboarding_complete,
      })
      setRiseScore(profile.rise_score)
      setStreak(streakData ?? profile.streak)
      setCoins(profile.coins)
      setOwnedItems(profile.owned_items)
      setEquippedItems(profile.equipped_items)
      setFriendCode(profile.friend_code)
    }

    // 2. Nutrition (today only)
    const { data: nutritionRow } = await supabase
      .from('nutrition_logs')
      .select('meals')
      .eq('user_id', uid)
      .eq('date', today)
      .single()

    setNutrition({
      date: today,
      meals: nutritionRow?.meals ?? { breakfast: [], lunch: [], dinner: [], snacks: [] },
    })

    // 3. Workout split
    const { data: splitRow } = await supabase
      .from('workout_splits')
      .select('split')
      .eq('user_id', uid)
      .single()

    setWorkoutSplit(splitRow?.split ?? DEFAULT_WORKOUT_SPLIT)

    // 4. Body PRs — flatten rows into BodyChartPRs shape
    const { data: prRows } = await supabase
      .from('body_prs')
      .select('muscle_group, exercise_id, value')
      .eq('user_id', uid)

    const prs = getEmptyPRs()
    prRows?.forEach(row => {
      const group = row.muscle_group as keyof BodyChartPRs
      if (prs[group] !== undefined) {
        prs[group][row.exercise_id] = row.value
      }
    })
    setBodyPRs(prs)

    // 5. Quest state (today)
    const { data: questRow } = await supabase
      .from('quest_states')
      .select('*')
      .eq('user_id', uid)
      .eq('assigned_date', today)
      .single()

    if (questRow) {
      setQuestState({
        quest: questRow.quest as DailyQuest,
        progress: questRow.progress,
        completed: questRow.completed,
        assignedDate: questRow.assigned_date,
      })
    } else {
      // Create today's quest
      const todaysQuest = getDailyQuest(today)
      const newQuestState: QuestState = {
        quest: todaysQuest,
        progress: 0,
        completed: false,
        assignedDate: today,
      }
      await supabase.from('quest_states').upsert({
        user_id: uid,
        quest: todaysQuest,
        progress: 0,
        completed: false,
        assigned_date: today,
      })
      setQuestState(newQuestState)
    }

    // 6. Friends — join with profiles for display data
    const { data: friendRows } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        friend:profiles!friendships_friend_id_fkey (
          id, name, profile_picture, friend_code, rise_score, streak
        )
      `)
      .eq('user_id', uid)

    setFriends(
      (friendRows ?? []).map(row => ({
        id: row.id,
        name: (row.friend as any)?.name ?? 'Unknown',
        profilePicture: (row.friend as any)?.profile_picture ?? '',
        friendCode: (row.friend as any)?.friend_code ?? '',
        riseScore: (row.friend as any)?.rise_score ?? 0,
        streak: (row.friend as any)?.streak ?? 0,
        status: row.status as 'pending' | 'accepted',
        addedAt: row.created_at,
      }))
    )

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData(user.id)
    } else if (!isAuthLoading) {
      // Not logged in — reset to defaults
      setIsLoaded(true)
    }
  }, [user, isAuthLoading, loadUserData])

  // ── Persist helpers ───────────────────────────────────────────────────────

  const saveProfile = useCallback(async (patch: Partial<{
    name: string; age: number; weight: number; height: number;
    gender: string; fitness_goal: string; profile_picture: string;
    calorie_goal: number; protein_goal: number; carb_goal: number; fat_goal: number;
    notifications: object; onboarding_complete: boolean;
    rise_score: number; coins: number; owned_items: string[];
    equipped_items: object;
  }>) => {
    if (!user) return
    await supabase.from('profiles').update(patch).eq('id', user.id)
  }, [user])

  // ── Actions ───────────────────────────────────────────────────────────────

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings }
      const profileChanged = ['weight','height','age','gender','fitnessGoal'].some(
        k => newSettings[k as keyof UserSettings] !== undefined
      )
      if (profileChanged && next.onboardingComplete) {
        const macros = calculateMacroTargets(next.weight, next.height, next.age, next.gender, next.fitnessGoal, bodyPRs, next.activityLevel)
        Object.assign(next, macros)
      }
      saveProfile({
        name: next.name,
        age: next.age,
        weight: next.weight,
        height: next.height,
        gender: next.gender,
        fitness_goal: next.fitnessGoal,
        profile_picture: next.profilePicture,
        calorie_goal: next.calorieGoal,
        protein_goal: next.proteinGoal,
        carb_goal: next.carbGoal,
        fat_goal: next.fatGoal,
        notifications: next.notifications,
        onboarding_complete: next.onboardingComplete,
      })
      return next
    })
  }, [bodyPRs, saveProfile])

  const recalculateGoals = useCallback(() => {
    setSettings(prev => {
      const macros = calculateMacroTargets(prev.weight, prev.height, prev.age, prev.gender, prev.fitnessGoal, bodyPRs, prev.activityLevel)
      const next = { ...prev, ...macros }
      saveProfile({ calorie_goal: next.calorieGoal, protein_goal: next.proteinGoal, carb_goal: next.carbGoal, fat_goal: next.fatGoal })
      return next
    })
  }, [bodyPRs, saveProfile])

  const getPerformanceScore = useCallback(() =>
    calculatePerformanceScore(bodyPRs, { age: settings.age, weightKg: settings.weight, gender: settings.gender }),
  [bodyPRs, settings])

  const completeOnboarding = useCallback(async (
    profile: { name: string; age: number; weight: number; height: number; gender: UserSettings['gender']; fitnessGoal: UserSettings['fitnessGoal']; activityLevel?: UserSettings['activityLevel']; experienceLevel?: UserSettings['experienceLevel'] },
    initialPRs?: { chest?: Record<string, number>; arms?: Record<string, number>; legs?: Record<string, number> }
  ) => {
    const mergedPRs: BodyChartPRs = {
      ...getEmptyPRs(),
      chest: { ...initialPRs?.chest },
      arms: { ...initialPRs?.arms },
      legs: { ...initialPRs?.legs },
    }
    setBodyPRs(mergedPRs)

    const macros = calculateMacroTargets(profile.weight, profile.height, profile.age, profile.gender, profile.fitnessGoal, mergedPRs, profile.activityLevel)
    const nextSettings = {
      ...profile,
      ...macros,
      activityLevel: profile.activityLevel ?? 'moderate',
      experienceLevel: profile.experienceLevel ?? 'beginner',
      onboardingComplete: true,
      profilePicture: '',
      notifications: DEFAULT_SETTINGS.notifications,
    }
    setSettings(nextSettings)

    if (!user) return

    // Save profile
    await saveProfile({
      name: profile.name,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      fitness_goal: profile.fitnessGoal,
      calorie_goal: macros.calorieGoal,
      protein_goal: macros.proteinGoal,
      carb_goal: macros.carbGoal,
      fat_goal: macros.fatGoal,
      onboarding_complete: true,
    })

    // Save initial PRs
    const prInserts: any[] = []
    ;(['chest', 'arms', 'legs'] as const).forEach(group => {
      const groupPRs = mergedPRs[group]
      Object.entries(groupPRs).forEach(([exerciseId, value]) => {
        if (value > 0) prInserts.push({ user_id: user.id, muscle_group: group, exercise_id: exerciseId, value })
      })
    })
    if (prInserts.length > 0) {
      await supabase.from('body_prs').upsert(prInserts, { onConflict: 'user_id,muscle_group,exercise_id' })
    }
  }, [user, saveProfile])

  const addRiseScore = useCallback((points: number) => {
    setRiseScore(prev => {
      const next = prev + points
      saveProfile({ rise_score: next })
      return next
    })
  }, [saveProfile])

  const addCoins = useCallback((amount: number) => {
    setCoins(prev => {
      const next = prev + amount
      saveProfile({ coins: next })
      return next
    })
  }, [saveProfile])

  const buyItem = useCallback((itemId: string, cost: number) => {
    setCoins(prev => {
      if (prev < cost) return prev
      const nextCoins = prev - cost
      setOwnedItems(prevItems => {
        if (prevItems.includes(itemId)) return prevItems
        const nextItems = [...prevItems, itemId]
        saveProfile({ coins: nextCoins, owned_items: nextItems })
        return nextItems
      })
      return nextCoins
    })
  }, [saveProfile])

  const equipItem = useCallback((itemId: string, type: string) => {
    setEquippedItems(prev => {
      const next = { ...prev, [type]: itemId }
      saveProfile({ equipped_items: next })
      return next
    })
  }, [saveProfile])

  // ── Nutrition ─────────────────────────────────────────────────────────────

  const persistNutrition = useCallback(async (updated: DailyNutrition) => {
    if (!user) return
    await supabase.from('nutrition_logs').upsert(
      { user_id: user.id, date: updated.date, meals: updated.meals },
      { onConflict: 'user_id,date' }
    )
  }, [user])

  const addMealEntry = useCallback((meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entry: MealEntry) => {
    setNutrition(prev => {
      const next = { ...prev, meals: { ...prev.meals, [meal]: [...prev.meals[meal], entry] } }
      persistNutrition(next)
      return next
    })
  }, [persistNutrition])

  const removeMealEntry = useCallback((meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks', entryId: string) => {
    setNutrition(prev => {
      const next = { ...prev, meals: { ...prev.meals, [meal]: prev.meals[meal].filter(e => e.id !== entryId) } }
      persistNutrition(next)
      return next
    })
  }, [persistNutrition])

  const getTodayTotals = useCallback(() => {
    const all = [...nutrition.meals.breakfast, ...nutrition.meals.lunch, ...nutrition.meals.dinner, ...nutrition.meals.snacks]
    return {
      calories: all.reduce((s, e) => s + e.calories, 0),
      protein:  all.reduce((s, e) => s + e.protein, 0),
      carbs:    all.reduce((s, e) => s + e.carbs, 0),
      fats:     all.reduce((s, e) => s + e.fats, 0),
    }
  }, [nutrition])

  // ── Workout split ─────────────────────────────────────────────────────────

  const persistSplit = useCallback(async (split: WorkoutDay[]) => {
    if (!user) return
    await supabase.from('workout_splits').upsert(
      { user_id: user.id, split },
      { onConflict: 'user_id' }
    )
  }, [user])

  const addExerciseToDay = useCallback((dayIndex: number, exercise: any) => {
    setWorkoutSplit(prev => {
      const next = [...prev]
      next[dayIndex] = { ...next[dayIndex], exercises: [...next[dayIndex].exercises, exercise] }
      persistSplit(next)
      return next
    })
  }, [persistSplit])

  const removeExerciseFromDay = useCallback((dayIndex: number, exerciseId: string) => {
    setWorkoutSplit(prev => {
      const next = [...prev]
      next[dayIndex] = { ...next[dayIndex], exercises: next[dayIndex].exercises.filter(e => e.id !== exerciseId) }
      persistSplit(next)
      return next
    })
  }, [persistSplit])

  const updateExercise = useCallback((dayIndex: number, exerciseId: string, updates: any) => {
    setWorkoutSplit(prev => {
      const next = [...prev]
      next[dayIndex] = { ...next[dayIndex], exercises: next[dayIndex].exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e) }
      persistSplit(next)
      return next
    })
  }, [persistSplit])

  // ── Body PRs ──────────────────────────────────────────────────────────────

  const updateBodyPR = useCallback((group: keyof BodyChartPRs, exerciseId: string, value: number) => {
    setBodyPRs(prev => {
      const next = { ...prev, [group]: { ...prev[group], [exerciseId]: value } }
      if (user) {
        supabase.from('body_prs').upsert(
          { user_id: user.id, muscle_group: group, exercise_id: exerciseId, value },
          { onConflict: 'user_id,muscle_group,exercise_id' }
        )
      }
      setSettings(s => {
        if (!s.onboardingComplete) return s
        const macros = calculateMacroTargets(s.weight, s.height, s.age, s.gender, s.fitnessGoal, next, s.activityLevel)
        return { ...s, ...macros }
      })
      return next
    })
  }, [user])

  const resetAllPRs = useCallback(() => {
    setBodyPRs(getEmptyPRs())
    if (user) {
      supabase.from('body_prs').delete().eq('user_id', user.id)
    }
  }, [user])

  // ── Quests ────────────────────────────────────────────────────────────────

  const updateQuestProgress = useCallback((progress: number) => {
    setQuestState(prev => {
      if (!prev || prev.completed) return prev
      const next = { ...prev, progress: Math.min(progress, prev.quest.target) }
      if (user) {
        supabase.from('quest_states').update({ progress: next.progress })
          .eq('user_id', user.id).eq('assigned_date', next.assignedDate)
      }
      return next
    })
  }, [user])

  const completeQuest = useCallback(() => {
    setQuestState(prev => {
      if (!prev || prev.completed) return prev
      const next = { ...prev, completed: true, progress: prev.quest.target }
      if (user) {
        supabase.from('quest_states').update({ completed: true, progress: next.progress })
          .eq('user_id', user.id).eq('assigned_date', next.assignedDate)
        // Award XP + coins
        addRiseScore(prev.quest.xpReward)
        addCoins(50)
      }
      return next
    })
  }, [user, addRiseScore, addCoins])

  // ── Friends ───────────────────────────────────────────────────────────────

  const addFriend = useCallback(async (code: string): Promise<AddFriendResult> => {
    const upper = code.toUpperCase().trim()
    if (upper === friendCode) return 'self'
    if (friends.some(f => f.friendCode === upper)) return 'already_added'
    if (!user) return 'not_found'

    // Look up the profile with this friend code
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, name, profile_picture, friend_code, rise_score, streak')
      .eq('friend_code', upper)
      .single()

    if (!targetProfile) return 'not_found'

    await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: targetProfile.id,
      status: 'accepted',
    })

    setFriends(prev => [...prev, {
      id: targetProfile.id,
      name: targetProfile.name,
      profilePicture: targetProfile.profile_picture,
      friendCode: targetProfile.friend_code,
      riseScore: targetProfile.rise_score,
      streak: targetProfile.streak,
      status: 'accepted',
      addedAt: new Date().toISOString(),
    }])

    return 'success'
  }, [user, friendCode, friends])

  const removeFriend = useCallback((id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id))
    if (user) {
      supabase.from('friendships').delete().eq('user_id', user.id).eq('id', id)
    }
  }, [user])

  // ── Auth ──────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // Reset state
    setSettings(DEFAULT_SETTINGS)
    setRiseScore(0)
    setStreak(0)
    setNutrition(getEmptyNutrition())
    setWorkoutSplit(DEFAULT_WORKOUT_SPLIT)
    setQuestState(null)
    setBodyPRs(getEmptyPRs())
    setFriends([])
    setFriendCode('')
    setCoins(0)
    setOwnedItems([])
    setEquippedItems({})
    setIsLoaded(false)
  }, [])

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      user, isAuthLoading, signOut,
      settings, isLoaded, riseScore, streak, nutrition, workoutSplit,
      questState, bodyPRs, friends, friendCode, coins, ownedItems, equippedItems,
      addCoins, buyItem, equipItem, updateSettings, getPerformanceScore,
      completeOnboarding, recalculateGoals, addRiseScore,
      addMealEntry, removeMealEntry, getTodayTotals,
      addExerciseToDay, removeExerciseFromDay, updateExercise,
      updateQuestProgress, completeQuest,
      updateBodyPR, resetAllPRs,
      addFriend, removeFriend,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within an AppProvider')
  return context
}