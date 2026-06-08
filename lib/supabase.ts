// lib/supabase.ts
// Supabase client — single instance shared across the app.
//
// Required env vars (add to .env.local):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Convenience singleton — use this everywhere in client components
export const supabase = createClient()

// ── Types that mirror the DB schema ──────────────────────────────────────────

export interface DbProfile {
  id: string
  name: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female'
  fitness_goal: 'lose_fat' | 'maintain' | 'build_muscle'
  profile_picture: string
  calorie_goal: number
  protein_goal: number
  carb_goal: number
  fat_goal: number
  notifications: { workouts: boolean; meals: boolean; streaks: boolean }
  onboarding_complete: boolean
  rise_score: number
  streak: number
  coins: number
  owned_items: string[]
  equipped_items: Record<string, string>
  friend_code: string
  last_active_date: string | null
}
