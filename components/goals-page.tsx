'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  ChevronRight,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Flame,
  DollarSign,
  Heart,
  Brain,
  Dumbbell,
  Briefcase,
  ArrowLeft,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

type GoalCategory = 'fitness' | 'wealth' | 'relationships' | 'mindset' | 'career' | 'custom'
type GoalTimeframe = '7' | '14' | '30' | '60' | '90' | '180' | '365'

interface GoalTip {
  week: number
  title: string
  action: string
}

interface Goal {
  id: string
  title: string
  category: GoalCategory
  timeframeDays: number
  createdAt: string
  tips: GoalTip[]
  checkedTips: string[]
  completed: boolean
  completedAt?: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { id: GoalCategory; label: string; icon: any; color: string; accent: string }[] = [
  { id: 'fitness',       label: 'Fitness',       icon: Dumbbell,   color: 'text-emerald-500',  accent: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'wealth',        label: 'Wealth',        icon: DollarSign, color: 'text-amber-500',    accent: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'relationships', label: 'Relationships', icon: Heart,      color: 'text-rose-500',     accent: 'bg-rose-500/10 border-rose-500/20' },
  { id: 'mindset',       label: 'Mindset',       icon: Brain,      color: 'text-violet-500',   accent: 'bg-violet-500/10 border-violet-500/20' },
  { id: 'career',        label: 'Career',        icon: Briefcase,  color: 'text-sky-500',      accent: 'bg-sky-500/10 border-sky-500/20' },
  { id: 'custom',        label: 'Other',         icon: Target,     color: 'text-primary',      accent: 'bg-primary/10 border-primary/20' },
]

const TIMEFRAMES: { value: GoalTimeframe; label: string; sublabel: string }[] = [
  { value: '7',   label: '1 Week',    sublabel: 'Sprint' },
  { value: '14',  label: '2 Weeks',   sublabel: 'Focused' },
  { value: '30',  label: '1 Month',   sublabel: 'Standard' },
  { value: '60',  label: '2 Months',  sublabel: 'Committed' },
  { value: '90',  label: '3 Months',  sublabel: 'Serious' },
  { value: '180', label: '6 Months',  sublabel: 'Transformation' },
  { value: '365', label: '1 Year',    sublabel: 'Life Change' },
]

const STORAGE_KEY = 'rise-goals-v1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveGoals(goals: Goal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)) } catch {}
}

function getDaysRemaining(goal: Goal): number {
  const created = new Date(goal.createdAt).getTime()
  const end = created + goal.timeframeDays * 86400000
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}

function getProgressPercent(goal: Goal): number {
  const created = new Date(goal.createdAt).getTime()
  const end = created + goal.timeframeDays * 86400000
  const elapsed = Date.now() - created
  return Math.min(100, Math.max(0, Math.round((elapsed / (end - created)) * 100)))
}

function getCategoryMeta(id: GoalCategory) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[5]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category, small }: { category: GoalCategory; small?: boolean }) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      meta.accent,
      small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
    )}>
      <Icon className={cn('shrink-0', meta.color, small ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span className={meta.color}>{meta.label}</span>
    </span>
  )
}

function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border">
      <motion.div
        className={cn('h-full rounded-full', color ?? 'bg-primary')}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── Goal Detail View ─────────────────────────────────────────────────────────

function GoalDetail({ goal, onBack, onUpdate }: {
  goal: Goal
  onBack: () => void
  onUpdate: (g: Goal) => void
}) {
  const meta = getCategoryMeta(goal.category)
  const Icon = meta.icon
  const daysLeft = getDaysRemaining(goal)
  const progress = getProgressPercent(goal)

  const toggleTip = (key: string) => {
    const next = goal.checkedTips.includes(key)
      ? goal.checkedTips.filter(k => k !== key)
      : [...goal.checkedTips, key]
    onUpdate({ ...goal, checkedTips: next })
  }

  const toggleComplete = () => {
    onUpdate({
      ...goal,
      completed: !goal.completed,
      completedAt: !goal.completed ? new Date().toISOString() : undefined,
    })
  }

  const totalTips = goal.tips.length
  const doneTips = goal.checkedTips.length
  const tipProgress = totalTips > 0 ? Math.round((doneTips / totalTips) * 100) : 0

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Goal Detail</p>
        </div>
        <CategoryBadge category={goal.category} small />
      </div>

      {/* Title card */}
      <div className={cn('rounded-2xl border p-5', meta.accent)}>
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', meta.accent)}>
            <Icon className={cn('h-5 w-5', meta.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">{goal.title}</h2>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {goal.timeframeDays} days total
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {daysLeft} days left
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Time elapsed</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <ProgressBar percent={progress} color={meta.color.replace('text-', 'bg-')} />
        </div>
      </div>

      {/* Task completion */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Action Items</p>
            <p className="text-xs text-muted-foreground">{doneTips} of {totalTips} completed</p>
          </div>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            tipProgress === 100 ? 'text-emerald-500' : 'text-primary'
          )}>{tipProgress}%</span>
        </div>
        <ProgressBar percent={tipProgress} color={tipProgress === 100 ? 'bg-emerald-500' : undefined} />
      </div>

      {/* Tips by week */}
      {goal.tips.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Roadmap
          </p>
          {goal.tips.map((tip, i) => {
            const key = `${tip.week}-${i}`
            const checked = goal.checkedTips.includes(key)
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => toggleTip(key)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                  checked
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {checked
                    ? <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                    : <Circle className="h-4.5 w-4.5 text-muted-foreground/40" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Week {tip.week}
                    </span>
                  </div>
                  <p className={cn('text-sm font-semibold', checked ? 'line-through text-muted-foreground' : 'text-foreground')}>
                    {tip.title}
                  </p>
                  <p className={cn('text-xs mt-0.5', checked ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
                    {tip.action}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Mark complete */}
      <button
        type="button"
        onClick={toggleComplete}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold transition-all',
          goal.completed
            ? 'border-muted bg-muted/30 text-muted-foreground'
            : 'border-primary bg-primary text-primary-foreground hover:opacity-90'
        )}
      >
        {goal.completed
          ? <><RotateCcw className="h-4 w-4" /> Mark Incomplete</>
          : <><CheckCircle2 className="h-4 w-4" /> Mark as Complete</>
        }
      </button>
    </div>
  )
}

// ─── New Goal Form ────────────────────────────────────────────────────────────

function NewGoalForm({ onSave, onCancel }: {
  onSave: (goal: Goal) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<'input' | 'timeframe' | 'generating' | 'preview'>('input')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('custom')
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('30')
  const [generatedTips, setGeneratedTips] = useState<GoalTip[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (step === 'input') setTimeout(() => inputRef.current?.focus(), 100)
  }, [step])

  const generateTips = async () => {
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, timeframeDays: parseInt(timeframe) }),
      })
      if (!res.ok) throw new Error('Failed to generate tips')
      const data = await res.json()
      setGeneratedTips(data.tips ?? [])
      setStep('preview')
    } catch (e) {
      setError('Could not generate your plan. Try again.')
      setStep('timeframe')
    }
  }

  const handleSave = () => {
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category,
      timeframeDays: parseInt(timeframe),
      createdAt: new Date().toISOString(),
      tips: generatedTips,
      checkedTips: [],
      completed: false,
    }
    onSave(goal)
  }

  // Step: input
  if (step === 'input') return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Set a Goal</h2>
          <p className="text-xs text-muted-foreground">Be specific — the more detail, the better your plan</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Goal</label>
        <textarea
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Make $10,000 a month, Get a girlfriend, Run a 5K..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const selected = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition-all',
                  selected ? `${cat.accent} ${cat.color}` : 'border-border bg-card text-muted-foreground hover:border-primary/20'
                )}
              >
                <Icon className={cn('h-4 w-4', selected ? cat.color : '')} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!title.trim()}
        onClick={() => setStep('timeframe')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
      >
        Continue <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )

  // Step: timeframe
  if (step === 'timeframe') return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep('input')} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Set a Timeframe</h2>
          <p className="text-xs text-muted-foreground">How long do you have to hit this?</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {TIMEFRAMES.map(tf => {
          const selected = timeframe === tf.value
          return (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 transition-all',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              )}
            >
              <div className="text-left">
                <p className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                  {tf.label}
                </p>
                <p className="text-xs text-muted-foreground">{tf.sublabel}</p>
              </div>
              <div className={cn(
                'h-4 w-4 rounded-full border-2 transition-all',
                selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              )} />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={generateTips}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        Generate My Plan
      </button>
    </div>
  )

  // Step: generating
  if (step === 'generating') return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Building your roadmap</p>
        <p className="text-xs text-muted-foreground mt-1">Analyzing your goal and creating a step-by-step plan...</p>
      </div>
    </div>
  )

  // Step: preview
  if (step === 'preview') return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep('timeframe')} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Your Plan</h2>
          <p className="text-xs text-muted-foreground">AI-generated roadmap for your goal</p>
        </div>
      </div>

      {/* Goal summary */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-foreground truncate pr-2">{title}</p>
          <CategoryBadge category={category} small />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {TIMEFRAMES.find(t => t.value === timeframe)?.label} plan
        </p>
      </div>

      {/* Tips preview */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {generatedTips.length} action items
        </p>
        {generatedTips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Week {tip.week}
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{tip.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{tip.action}</p>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <CheckCircle2 className="h-4 w-4" />
        Lock In This Goal
      </button>
    </div>
  )

  return null
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list')
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<'active' | 'done'>('active')

  useEffect(() => {
    setGoals(loadGoals())
  }, [])

  const persistGoals = (next: Goal[]) => {
    setGoals(next)
    saveGoals(next)
  }

  const handleSave = (goal: Goal) => {
    const next = [goal, ...goals]
    persistGoals(next)
    setActiveGoal(goal)
    setView('detail')
  }

  const handleUpdate = (updated: Goal) => {
    const next = goals.map(g => g.id === updated.id ? updated : g)
    persistGoals(next)
    setActiveGoal(updated)
  }

  const handleDelete = (id: string) => {
    const next = goals.filter(g => g.id !== id)
    persistGoals(next)
    if (activeGoal?.id === id) { setActiveGoal(null); setView('list') }
  }

  const activeGoals = goals.filter(g => !g.completed)
  const doneGoals = goals.filter(g => g.completed)
  const displayGoals = filter === 'active' ? activeGoals : doneGoals

  if (view === 'new') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <NewGoalForm
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      </motion.div>
    )
  }

  if (view === 'detail' && activeGoal) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GoalDetail
          goal={activeGoal}
          onBack={() => setView('list')}
          onUpdate={handleUpdate}
        />
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => handleDelete(activeGoal.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Delete goal
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} active · {doneGoals.length} completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView('new')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" /> New Goal
        </button>
      </div>

      {/* Stats strip */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active', value: activeGoals.length, icon: Flame, color: 'text-primary' },
            { label: 'Done', value: doneGoals.length, icon: CheckCircle2, color: 'text-emerald-500' },
            {
              label: 'Avg Progress',
              value: `${activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + getProgressPercent(g), 0) / activeGoals.length) : 0}%`,
              icon: TrendingUp,
              color: 'text-sky-500'
            },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-2xl border border-border bg-card px-3 py-3 text-center">
                <Icon className={cn('mx-auto h-4 w-4 mb-1', stat.color)} />
                <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      {goals.length > 0 && (
        <div className="flex gap-1.5 rounded-2xl bg-secondary/60 p-1">
          {(['active', 'done'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-colors',
                filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {f === 'active' ? `Active (${activeGoals.length})` : `Done (${doneGoals.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Goal cards */}
      <AnimatePresence mode="popLayout">
        {displayGoals.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
              <Target className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {filter === 'active' ? 'No active goals' : 'No completed goals'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filter === 'active' ? 'Set your first goal and lock in' : 'Complete a goal to see it here'}
              </p>
            </div>
            {filter === 'active' && (
              <button
                type="button"
                onClick={() => setView('new')}
                className="mt-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Set a Goal
              </button>
            )}
          </motion.div>
        ) : (
          displayGoals.map((goal, i) => {
            const meta = getCategoryMeta(goal.category)
            const Icon = meta.icon
            const daysLeft = getDaysRemaining(goal)
            const progress = getProgressPercent(goal)
            const tipProgress = goal.tips.length > 0
              ? Math.round((goal.checkedTips.length / goal.tips.length) * 100)
              : 0

            return (
              <motion.button
                key={goal.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setActiveGoal(goal); setView('detail') }}
                className="w-full rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    meta.accent
                  )}>
                    <Icon className={cn('h-4 w-4', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {goal.title}
                      </p>
                      {goal.completed && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryBadge category={goal.category} small />
                      {!goal.completed && (
                        <span className="text-xs text-muted-foreground">
                          {daysLeft}d left
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-1" />
                </div>

                {!goal.completed && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Time</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <ProgressBar percent={progress} color={meta.color.replace('text-', 'bg-')} />
                    {goal.tips.length > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span>Tasks</span>
                          <span className="font-medium text-foreground">{goal.checkedTips.length}/{goal.tips.length}</span>
                        </div>
                        <ProgressBar percent={tipProgress} />
                      </>
                    )}
                  </div>
                )}
              </motion.button>
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}
