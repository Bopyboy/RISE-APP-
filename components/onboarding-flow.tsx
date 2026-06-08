'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  ChevronRight, ChevronLeft, User, Scale, Ruler, Moon, Sun,
  Dumbbell, Flame, Target, Zap, Activity,
} from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { FitnessGoal, Gender, ActivityLevel, ExperienceLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

const GOALS: { id: FitnessGoal; icon: typeof Flame; label: string; desc: string; color: string }[] = [
  { id: 'lose_fat',     icon: Flame,    label: 'Lose fat',      desc: 'Calorie deficit · high protein · cardio mix',    color: 'text-orange-500' },
  { id: 'maintain',    icon: Target,   label: 'Stay lean',     desc: 'Maintain weight · build strength · feel great',   color: 'text-blue-500' },
  { id: 'build_muscle',icon: Dumbbell, label: 'Build muscle',  desc: 'Calorie surplus · progressive overload · PRs',    color: 'text-primary' },
]

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; desc: string; days: string }[] = [
  { id: 'sedentary',   label: 'Sedentary',       desc: 'Desk job, mostly sitting',                days: 'Little or no exercise' },
  { id: 'light',       label: 'Lightly active',  desc: 'Walking, casual movement',                days: '1–2 days / week' },
  { id: 'moderate',    label: 'Moderately active',desc: 'Regular gym sessions',                   days: '3–4 days / week' },
  { id: 'active',      label: 'Very active',      desc: 'Hard training most days',                days: '5–6 days / week' },
  { id: 'very_active', label: 'Athlete',          desc: 'Physical job or twice-daily training',   days: 'Daily + heavy' },
]

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string; years: string }[] = [
  { id: 'beginner',     label: 'Beginner',     desc: 'New to lifting or returning after a long break', years: '< 1 year' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Consistent training, know the basics',           years: '1–3 years' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Experienced lifter, track PRs regularly',        years: '3+ years' },
]

const TOTAL_STEPS = 8

export function OnboardingFlow() {
  const { completeOnboarding } = useApp()
  const { setTheme } = useTheme()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  const [themeChoice, setThemeChoice] = useState<'dark' | 'light'>('dark')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [goal, setGoal] = useState<FitnessGoal>('build_muscle')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner')
  const [chestPR, setChestPR] = useState('')
  const [armsPR, setArmsPR] = useState('')
  const [legsPR, setLegsPR] = useState('')

  const weightLabel = unitSystem === 'metric' ? 'kg' : 'lbs'

  const getHeightCm = () => {
    if (unitSystem === 'metric') return parseFloat(height) || 0
    return ((parseInt(heightFeet) || 0) * 12 + (parseInt(heightInches) || 0)) * 2.54
  }

  const getWeightKg = () => {
    const v = parseFloat(weight) || 0
    return unitSystem === 'metric' ? v : v / 2.205
  }

  const prToKg = (val: string) => {
    const v = parseFloat(val) || 0
    return unitSystem === 'metric' ? v : v / 2.205
  }

  const canNext = (() => {
    switch (step) {
      case 1: return name.trim().length >= 1
      case 4: return parseInt(age) >= 13 && parseInt(age) <= 80 && getWeightKg() > 20 && getHeightCm() > 100
      default: return true
    }
  })()

  const go = (direction: 1 | -1) => {
    if (direction === 1 && !canNext) return
    setDir(direction)
    if (direction === 1 && step === TOTAL_STEPS - 1) {
      finish()
    } else {
      setStep(s => s + direction)
    }
  }

  const applyTheme = (t: 'dark' | 'light') => {
    setThemeChoice(t)
    setTheme(t)
  }

  const finish = () => {
    const initialPRs: { chest?: Record<string, number>; arms?: Record<string, number>; legs?: Record<string, number> } = {}
    const chestKg = prToKg(chestPR)
    const armsKg = prToKg(armsPR)
    const legsKg = prToKg(legsPR)
    if (chestKg > 0) initialPRs.chest = { 'Bench Press': chestKg }
    if (armsKg > 0) initialPRs.arms = { 'Barbell Curl': armsKg }
    if (legsKg > 0) initialPRs.legs = { 'Squat': legsKg }

    completeOnboarding(
      { name: name.trim(), age: parseInt(age), weight: getWeightKg(), height: getHeightCm(), gender, fitnessGoal: goal, activityLevel, experienceLevel },
      initialPRs
    )
  }

  const stepTitles = [null, 'What should we call you?', 'Quick about you', 'Your units', 'Body stats', "What's your main goal?", 'Your lifestyle', 'Baseline strength']

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-8 pt-10">
      <div className="mx-auto w-full max-w-md">

        <div className="mb-8">
          {step === 0 ? (
            <>
              <h1 className="text-4xl font-bold text-foreground">Welcome to Rise</h1>
              <p className="mt-3 text-base text-muted-foreground">Your plan, your rank, your pace. Let's set everything up so Rise actually fits you.</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Setup · {step}/{TOTAL_STEPS - 1}</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">{stepTitles[step]}</h1>
            </>
          )}
          <div className="mt-5 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-secondary')} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: dir > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? -20 : 20 }}
            transition={{ duration: 0.18 }}
          >

            {/* Step 0 — Theme */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card px-6 py-8 text-center">
                  <Dumbbell className="mx-auto h-12 w-12 text-primary" />
                  <h2 className="mt-4 text-xl font-bold text-foreground">Rise to the top</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Personalized workouts, AI meal plans, and a rank system built on your actual lifts.</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Pick your theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['dark', 'light'] as const).map(t => (
                    <button key={t} type="button" onClick={() => applyTheme(t)}
                      className={cn('flex flex-col items-center gap-2 rounded-2xl border py-6 transition-colors',
                        themeChoice === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground')}>
                      {t === 'dark' ? <Moon className="h-8 w-8" /> : <Sun className="h-8 w-8" />}
                      <span className="font-semibold capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Name */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">This is how Rise will address you</span>
                </div>
                <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && go(1)}
                  placeholder="Your name" autoFocus
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}

            {/* Step 2 — Gender */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Used to calculate accurate strength standards and calorie targets</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as Gender[]).map(g => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={cn('rounded-2xl border py-5 text-center font-semibold capitalize transition-colors',
                        gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground')}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Units */}
            {step === 3 && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">Choose your preferred measurement system</p>
                <div className="grid grid-cols-2 gap-3">
                  {([['metric', 'kg / cm'], ['imperial', 'lbs / ft·in']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setUnitSystem(val)}
                      className={cn('rounded-2xl border py-5 text-center font-semibold transition-colors',
                        unitSystem === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 — Body stats */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Used to calculate your TDEE and personalised calorie target</p>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground"><User className="h-4 w-4" /> Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 22"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground"><Scale className="h-4 w-4" /> Weight ({weightLabel})</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={unitSystem === 'metric' ? 'e.g. 75' : 'e.g. 165'}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground"><Ruler className="h-4 w-4" /> Height</label>
                  {unitSystem === 'metric' ? (
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 178 cm"
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input type="number" value={heightFeet} onChange={e => setHeightFeet(e.target.value)} placeholder="ft"
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <span className="mt-1 block text-center text-xs text-muted-foreground">feet</span>
                      </div>
                      <div className="flex-1">
                        <input type="number" value={heightInches} onChange={e => setHeightInches(e.target.value)} placeholder="in"
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <span className="mt-1 block text-center text-xs text-muted-foreground">inches</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5 — Goal */}
            {step === 5 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">This shapes your calorie target, macro split, and workout programming</p>
                {GOALS.map(g => {
                  const Icon = g.icon
                  return (
                    <button key={g.id} type="button" onClick={() => setGoal(g.id)}
                      className={cn('flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                        goal === g.id ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary', goal === g.id && 'bg-primary/20')}>
                        <Icon className={cn('h-5 w-5', g.color)} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{g.label}</p>
                        <p className="text-xs text-muted-foreground">{g.desc}</p>
                      </div>
                      {goal === g.id && (
                        <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 6 — Activity + Experience */}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">How active are you day-to-day?</p>
                  </div>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map(a => (
                      <button key={a.id} type="button" onClick={() => setActivityLevel(a.id)}
                        className={cn('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors',
                          activityLevel === a.id ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                        <div>
                          <p className="font-semibold text-foreground">{a.label}</p>
                          <p className="text-xs text-muted-foreground">{a.desc}</p>
                        </div>
                        <span className={cn('ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          activityLevel === a.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}>
                          {a.days}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Lifting experience</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPERIENCE_LEVELS.map(e => (
                      <button key={e.id} type="button" onClick={() => setExperienceLevel(e.id)}
                        className={cn('flex flex-col items-center rounded-2xl border px-2 py-4 text-center transition-colors',
                          experienceLevel === e.id ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                        <p className="font-semibold text-foreground text-sm">{e.label}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{e.years}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7 — Baseline PRs */}
            {step === 7 && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Enter your best working weight for these three lifts — this sets your starting rank. Skip any you don't track yet.
                </p>

                {[
                  { label: 'Bench Press', sub: 'Chest PR', emoji: '💪', bg: 'bg-red-500/15', val: chestPR, set: setChestPR, placeholder: unitSystem === 'metric' ? 'e.g. 80' : 'e.g. 175' },
                  { label: 'Barbell Curl', sub: 'Arms PR', emoji: '💪', bg: 'bg-purple-500/15', val: armsPR, set: setArmsPR, placeholder: unitSystem === 'metric' ? 'e.g. 40' : 'e.g. 90' },
                  { label: 'Squat', sub: 'Legs PR', emoji: '🦵', bg: 'bg-green-500/15', val: legsPR, set: setLegsPR, placeholder: unitSystem === 'metric' ? 'e.g. 100' : 'e.g. 225' },
                ].map(({ label, sub, emoji, bg, val, set, placeholder }) => (
                  <div key={label} className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-lg', bg)}>{emoji}</div>
                      <div>
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <span className="w-8 text-sm font-medium text-muted-foreground">{weightLabel}</span>
                    </div>
                  </div>
                ))}

                <p className="text-center text-xs text-muted-foreground">
                  These sync with your AI workout plan and rank — you can update them anytime.
                </p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => go(-1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-semibold text-foreground transition-colors hover:bg-secondary">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
          )}
          <button type="button" disabled={!canNext} onClick={() => go(1)}
            className={cn('flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-opacity',
              canNext ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground opacity-40')}>
            {step === TOTAL_STEPS - 1 ? 'Enter Rise' : 'Continue'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </div>
  )
}