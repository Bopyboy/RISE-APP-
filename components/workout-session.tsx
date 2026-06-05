'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { WorkoutDay, Exercise } from '@/lib/types'
import {
  Play,
  Pause,
  Check,
  X,
  ChevronLeft,
  Timer,
  Zap,
  Trophy,
  Plus,
  Minus,
  RotateCcw,
  Volume2,
  VolumeX,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetLog {
  setNumber: number
  targetReps: string
  actualReps: number
  weight: number // kg
  completed: boolean
}

interface ExerciseLog {
  exerciseId: string
  name: string
  sets: SetLog[]
}

type SessionPhase = 'ready' | 'active' | 'rest' | 'done'

const REST_PRESETS = [60, 90, 120, 180] as const
const DEFAULT_REST = 90

// ─── Weight recommendation ────────────────────────────────────────────────────

/**
 * Returns a suggested starting weight (kg) and rep target for an exercise
 * based on the user's bodyweight, goal, and experience level.
 * Uses rough percentage-of-bodyweight multipliers common in beginner programming.
 */
function getRecommendation(
  exerciseName: string,
  weightKg: number,
  goal: string,
  experience: string
): { weight: number; reps: string; note: string } | null {
  if (!weightKg || weightKg < 20) return null

  const name = exerciseName.toLowerCase()
  const expMult = experience === 'beginner' ? 1 : experience === 'intermediate' ? 1.3 : 1.6

  // Bodyweight ratios (as fraction of bodyweight) for beginner
  let bwRatio = 0
  if (name.includes('bench')) bwRatio = 0.5
  else if (name.includes('squat')) bwRatio = 0.6
  else if (name.includes('deadlift')) bwRatio = 0.75
  else if (name.includes('overhead') || name.includes('ohp') || name.includes('press')) bwRatio = 0.3
  else if (name.includes('row')) bwRatio = 0.4
  else if (name.includes('curl')) bwRatio = 0.2
  else if (name.includes('lat') || name.includes('pulldown')) bwRatio = 0.45
  else if (name.includes('leg press')) bwRatio = 1.0
  else if (name.includes('rdl') || name.includes('romanian')) bwRatio = 0.5
  else if (name.includes('tricep') || name.includes('pushdown')) bwRatio = 0.22
  else return null // bodyweight / machine — no weight suggestion needed

  const rawKg = Math.round((weightKg * bwRatio * expMult) / 2.5) * 2.5

  const repRange = goal === 'lose_fat'
    ? '12–15'
    : goal === 'build_muscle'
    ? experience === 'advanced' ? '4–6' : '8–12'
    : '10–12'

  const note = experience === 'beginner'
    ? 'Start here, adjust up if easy'
    : 'Based on your stats — adjust as needed'

  return { weight: Math.max(2.5, rawKg), reps: repRange, note }
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch {}
}

// ─── Beep (Web Audio) ─────────────────────────────────────────────────────────

function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const beep = useCallback((freq = 880, duration = 0.12, vol = 0.25) => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [getCtx])

  // Double beep = set complete, triple = rest done
  const beepSetDone = useCallback(() => {
    beep(660, 0.1)
    setTimeout(() => beep(880, 0.15), 120)
  }, [beep])

  const beepRestDone = useCallback(() => {
    beep(660, 0.08)
    setTimeout(() => beep(880, 0.08), 100)
    setTimeout(() => beep(1100, 0.18), 200)
  }, [beep])

  const beepCountdown = useCallback(() => {
    beep(440, 0.07, 0.15)
  }, [beep])

  return { beepSetDone, beepRestDone, beepCountdown }
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer({
  seconds,
  soundEnabled,
  onSkip,
  onAdjust,
}: {
  seconds: number
  soundEnabled: boolean
  onSkip: () => void
  onAdjust: (delta: number) => void
}) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const { beepRestDone, beepCountdown } = useBeep()
  const prevRemaining = useRef(seconds)

  // Reset when base changes (new rest period)
  useEffect(() => {
    setRemaining(seconds)
    setFinished(false)
    setPaused(false)
    prevRemaining.current = seconds
  }, [seconds])

  useEffect(() => {
    if (paused || remaining <= 0) return
    const id = setTimeout(() => {
      const next = remaining - 1

      // Countdown beeps at 3, 2, 1
      if (soundEnabled && next <= 3 && next > 0) {
        beepCountdown()
      }

      if (next <= 0) {
        if (soundEnabled) beepRestDone()
        vibrate([80, 60, 80, 60, 150])
        setFinished(true)
        // Auto-advance after 1.2s so user sees the flash
        setTimeout(onSkip, 1200)
      }

      setRemaining(next)
    }, 1000)
    return () => clearTimeout(id)
  }, [remaining, paused, soundEnabled, beepRestDone, beepCountdown, onSkip])

  const total = seconds
  const pct = Math.max(0, (remaining / total) * 100)
  const isUrgent = remaining <= 10
  const isWarning = remaining <= 30 && remaining > 10

  const arcColor = finished
    ? '#22c55e'
    : isUrgent
    ? '#ef4444'
    : isWarning
    ? '#f97316'
    : '#22c55e'

  const circumference = 2 * Math.PI * 48

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rest</p>
        {/* Preset buttons */}
        <div className="flex gap-1.5">
          {REST_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onAdjust(preset - seconds)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                seconds === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {preset}s
            </button>
          ))}
        </div>
      </div>

      {/* Circle countdown */}
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 112 112">
          {/* Track */}
          <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="7" className="text-secondary" />
          {/* Progress arc */}
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke={arcColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {finished ? (
            <span className="animate-pulse text-2xl font-black text-green-500">GO!</span>
          ) : (
            <>
              <span
                className={cn('text-4xl font-black tabular-nums transition-colors', isUrgent && 'animate-pulse')}
                style={{ color: arcColor }}
              >
                {remaining}
              </span>
              <span className="text-xs text-muted-foreground">sec</span>
            </>
          )}
        </div>
      </div>

      {/* Nudge + control buttons */}
      <div className="flex w-full items-center gap-2">
        <button
          onClick={() => onAdjust(-15)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80"
        >
          <Minus className="h-3.5 w-3.5" />
          15s
        </button>

        <button
          onClick={() => setPaused(p => !p)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <button
          onClick={() => onAdjust(15)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80"
        >
          <Plus className="h-3.5 w-3.5" />
          15s
        </button>
      </div>

      <button
        onClick={onSkip}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <SkipForward className="h-4 w-4" />
        Skip rest
      </button>
    </div>
  )
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({
  set,
  onComplete,
  onWeightChange,
  onRepsChange,
}: {
  set: SetLog
  onComplete: () => void
  onWeightChange: (v: number) => void
  onRepsChange: (v: number) => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        set.completed
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-border bg-secondary/30'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          set.completed ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'
        )}
      >
        {set.completed ? <Check className="h-3.5 w-3.5" /> : set.setNumber}
      </span>

      {/* Weight */}
      <div className="flex flex-1 items-center gap-1">
        <button
          onClick={() => onWeightChange(Math.max(0, set.weight - 2.5))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[52px] text-center text-sm font-semibold tabular-nums">
          {set.weight}kg
        </span>
        <button
          onClick={() => onWeightChange(set.weight + 2.5)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onRepsChange(Math.max(0, set.actualReps - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[36px] text-center text-sm font-semibold tabular-nums">
          {set.actualReps}
        </span>
        <button
          onClick={() => onRepsChange(set.actualReps + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Complete */}
      <button
        onClick={onComplete}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          set.completed
            ? 'bg-green-500 text-white'
            : 'border border-border bg-card text-muted-foreground hover:border-green-500 hover:text-green-500'
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Summary Screen ───────────────────────────────────────────────────────────

function WorkoutSummary({
  log,
  duration,
  xpEarned,
  onClose,
}: {
  log: ExerciseLog[]
  duration: number
  xpEarned: number
  onClose: () => void
}) {
  const totalSets = log.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)
  const totalVolume = log.reduce(
    (s, e) => s + e.sets.filter(x => x.completed).reduce((sv, set) => sv + set.weight * set.actualReps, 0),
    0
  )
  const mins = Math.floor(duration / 60)
  const secs = duration % 60

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
        <Trophy className="h-10 w-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Workout Done!</h2>
        <p className="text-sm text-muted-foreground">Great session — keep the streak going 🔥</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {[
          { label: 'Duration', value: `${mins}:${String(secs).padStart(2, '0')}` },
          { label: 'Sets', value: totalSets },
          { label: 'Volume', value: `${Math.round(totalVolume)}kg` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-bold text-primary">+{xpEarned} XP earned</span>
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logged exercises</p>
        {log.map(ex => {
          const done = ex.sets.filter(s => s.completed)
          if (!done.length) return null
          return (
            <div key={ex.exerciseId} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{ex.name}</span>
              <span className="text-muted-foreground">
                {done.length} sets · {Math.round(done.reduce((s, x) => s + x.weight * x.actualReps, 0))}kg
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
      >
        Back to Train
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WorkoutSessionProps {
  day: WorkoutDay
  onClose: () => void
}

export function WorkoutSession({ day, onClose }: WorkoutSessionProps) {
  const { addRiseScore, settings } = useApp()
  const { beepSetDone } = useBeep()

  const [phase, setPhase] = useState<SessionPhase>('ready')
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() =>
    day.exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        targetReps: ex.reps,
        actualReps: parseInt(ex.reps) || 10,
        weight: 0,
        completed: false,
      })),
    }))
  )

  const [currentExIndex, setCurrentExIndex] = useState(0)
  // Rest duration — persisted in localStorage so last choice is remembered
  const [restSeconds, setRestSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rise-rest-duration')
      return saved ? parseInt(saved) : DEFAULT_REST
    } catch { return DEFAULT_REST }
  })
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('rise-sound') !== 'off' } catch { return true }
  })
  const [elapsed, setElapsed] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [restKey, setRestKey] = useState(0) // bump to restart RestTimer
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  useEffect(() => {
    if (phase === 'active' || phase === 'rest') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const persistRestDuration = (val: number) => {
    setRestSeconds(val)
    try { localStorage.setItem('rise-rest-duration', String(val)) } catch {}
  }

  const toggleSound = () => {
    setSoundEnabled(s => {
      const next = !s
      try { localStorage.setItem('rise-sound', next ? 'on' : 'off') } catch {}
      return next
    })
  }

  const startWorkout = () => {
    startTimeRef.current = Date.now()
    setPhase('active')
  }

  const completeSet = (exIdx: number, setIdx: number) => {
    setExerciseLogs(prev => {
      const updated = prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si !== setIdx ? s : { ...s, completed: !s.completed }
              ),
            }
      )
      return updated
    })
    if (soundEnabled) beepSetDone()
    vibrate([40, 30, 80])
    setPhase('rest')
    setRestKey(k => k + 1) // restart timer fresh
  }

  const handleAdjustRest = (delta: number) => {
    const next = Math.max(15, Math.min(300, restSeconds + delta))
    persistRestDuration(next)
    setRestKey(k => k + 1) // restart with new duration
  }

  const updateWeight = (exIdx: number, setIdx: number, v: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, si) => (si !== setIdx ? s : { ...s, weight: v })) }
      )
    )
  }

  const updateReps = (exIdx: number, setIdx: number, v: number) => {
    setExerciseLogs(prev =>
      prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, si) => (si !== setIdx ? s : { ...s, actualReps: v })) }
      )
    )
  }

  const finishWorkout = () => {
    const completedSets = exerciseLogs.reduce(
      (s, e) => s + e.sets.filter(x => x.completed).length,
      0
    )
    const xp = Math.max(50, completedSets * 15)
    setXpEarned(xp)
    addRiseScore(xp)
    setPhase('done')
  }

  const allDone = exerciseLogs.every(ex => ex.sets.every(s => s.completed))
  const completedSets = exerciseLogs.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)
  const totalSets = exerciseLogs.reduce((s, e) => s + e.sets.length, 0)
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  if (phase === 'done') {
    return (
      <WorkoutSummary
        log={exerciseLogs}
        duration={elapsed}
        xpEarned={xpEarned}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-foreground">{day.name}</h2>
          <p className="text-xs text-muted-foreground">{day.day}</p>
        </div>

        {/* Sound toggle */}
        {(phase === 'active' || phase === 'rest') && (
          <button
            onClick={toggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}

        {/* Elapsed timer */}
        {(phase === 'active' || phase === 'rest') && (
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5">
            <Timer className="h-3.5 w-3.5 text-primary" />
            <span className="tabular-nums text-sm font-semibold">
              {mins}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {phase !== 'ready' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedSets} / {totalSets} sets</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ready state */}
      {phase === 'ready' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Today's workout</p>
            <ul className="mt-2 space-y-1">
              {day.exercises.map(ex => (
                <li key={ex.id} className="text-sm text-muted-foreground">
                  {ex.name} · {ex.sets}×{ex.reps}
                </li>
              ))}
            </ul>
          </div>

          {/* Rest duration picker on ready screen */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Default rest between sets</p>
            <div className="flex gap-2">
              {REST_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => persistRestDuration(preset)}
                  className={cn(
                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                    restSeconds === preset
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {preset}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startWorkout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-primary-foreground text-lg"
          >
            <Play className="h-5 w-5 fill-primary-foreground" />
            Start Workout
          </button>
        </div>
      )}

      {/* Rest timer */}
      {phase === 'rest' && (
        <RestTimer
          key={restKey}
          seconds={restSeconds}
          soundEnabled={soundEnabled}
          onSkip={() => setPhase('active')}
          onAdjust={handleAdjustRest}
        />
      )}

      {/* Exercise logs */}
      {(phase === 'active' || phase === 'rest') && (
        <div className="space-y-4">
          {exerciseLogs.map((ex, exIdx) => (
            <div key={ex.exerciseId} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Exercise header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets done
                  </p>
                </div>
                {ex.sets.every(s => s.completed) && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-500">
                    <Check className="h-3 w-3" /> Done
                  </span>
                )}
              </div>

              {/* Recommendation banner — shown when no sets completed yet */}
              {(() => {
                const rec = getRecommendation(ex.name, settings.weight, settings.fitnessGoal, settings.experienceLevel ?? 'beginner')
                const anyDone = ex.sets.some(s => s.completed)
                if (!rec || anyDone) return null
                return (
                  <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
                    <Zap className="h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary">Suggested start</p>
                      <p className="text-xs text-muted-foreground">{rec.weight}kg · {rec.reps} reps · {rec.note}</p>
                    </div>
                  </div>
                )
              })()}

              {/* Set headers */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="w-7 text-center">Set</span>
                <span className="flex-1 text-center">Weight</span>
                <span className="w-28 text-center">Reps</span>
                <span className="w-8" />
              </div>

              {/* Sets */}
              <div className="space-y-2 px-3 pb-3">
                {ex.sets.map((set, setIdx) => (
                  <SetRow
                    key={setIdx}
                    set={set}
                    onComplete={() => completeSet(exIdx, setIdx)}
                    onWeightChange={v => updateWeight(exIdx, setIdx, v)}
                    onRepsChange={v => updateReps(exIdx, setIdx, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Finish button */}
      {(phase === 'active' || phase === 'rest') && (
        <button
          onClick={finishWorkout}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg transition-colors',
            allDone
              ? 'bg-green-500 text-white'
              : 'border border-border bg-card text-muted-foreground'
          )}
        >
          <Trophy className="h-5 w-5" />
          {allDone ? 'Finish Workout' : `Finish Early (${completedSets}/${totalSets} sets)`}
        </button>
      )}
    </div>
  )
}