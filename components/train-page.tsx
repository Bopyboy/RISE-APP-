'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { generateFitnessPlan } from '@/lib/fitness-plans'
import { WorkoutPage } from '@/components/workout-page'
import { WorkoutSession } from '@/components/workout-session'
import { WorkoutDay } from '@/lib/types'
import { Dumbbell, Sparkles, CalendarDays, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type TrainSection = 'plan' | 'workouts'

export function TrainPage({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { settings, bodyPRs, workoutSplit } = useApp()
  const [section, setSection] = useState<TrainSection>('plan')
  const [activeSession, setActiveSession] = useState<WorkoutDay | null>(null)

  const plan = useMemo(
    () =>
      generateFitnessPlan(
        settings.weight,
        settings.height,
        settings.age,
        settings.gender,
        settings.fitnessGoal,
        bodyPRs,
        workoutSplit
      ),
    [settings, bodyPRs, workoutSplit]
  )

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const tabs: { id: TrainSection; label: string; icon: typeof Sparkles }[] = [
    { id: 'plan', label: 'My Plan', icon: Sparkles },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  ]

  // ── Live session view ──────────────────────────────────────────────────────
  if (activeSession) {
    return (
      <WorkoutSession
        day={activeSession}
        onClose={() => setActiveSession(null)}
      />
    )
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Train</h1>
        <p className="text-sm text-muted-foreground">Workouts & strength built around your PRs</p>
      </div>

      <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors',
                section === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {section === 'plan' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-primary">Your level</p>
                <p className="text-lg font-bold text-foreground">{plan.trainingLevel}</p>
                <p className="text-sm text-muted-foreground">{plan.splitType}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold capitalize text-primary">
                {settings.fitnessGoal.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTabChange?.('food')}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Weekly meal plan</p>
              <p className="text-sm text-muted-foreground">
                {plan.macros.calorieGoal} kcal · {plan.macros.proteinGoal}g protein — now on Food tab
              </p>
            </div>
            <span className="text-sm font-medium text-primary">Open →</span>
          </button>

          {/* Workout days with Start buttons */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Custom workout split</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.workoutNote}</p>

            <div className="mt-3 space-y-3">
              {workoutSplit.map((day, i) => {
                const isToday = day.day === today
                const isRest = day.name === 'Rest Day'

                return (
                  <div
                    key={day.day}
                    className={cn(
                      'rounded-xl p-3',
                      isToday ? 'border border-primary/40 bg-primary/5' : 'bg-secondary/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {day.day}
                          {isToday && (
                            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                              TODAY
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{day.name}</p>
                      </div>

                      {!isRest && (
                        <button
                          type="button"
                          onClick={() => setActiveSession(day)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors',
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground hover:border-primary/40'
                          )}
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Start
                        </button>
                      )}
                    </div>

                    {!isRest && day.exercises.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {day.exercises.slice(0, 3).map((ex, ei) => (
                          <li key={ei} className="text-xs text-muted-foreground">
                            {ex.name} · {ex.sets}×{ex.reps}
                          </li>
                        ))}
                        {day.exercises.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{day.exercises.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setSection('workouts')}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium"
            >
              Edit weekly workouts
            </button>
          </div>
        </div>
      )}

      {section === 'workouts' && (
        <WorkoutPage
          embedded
          onStartSession={(day: WorkoutDay) => setActiveSession(day)}
        />
      )}
    </div>
  )
}