'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { Friend } from '@/lib/types'
import { getRankByPerformance } from '@/lib/performance-rank'
import {
  Swords, Flame, Trophy, Dumbbell, Zap,
  ChevronLeft, Crown, Target, TrendingUp,
  Shield, Star, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyStats {
  workouts: number
  caloriesHit: number   // days nutrition was logged
  streak: number
  riseScore: number
}

interface RivalChallenge {
  category: 'workouts' | 'nutrition' | 'streak' | 'strength'
  label: string
  icon: typeof Dumbbell
  emoji: string
  description: string
  yours: number
  theirs: number
  unit: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeeklyWorkouts(): number {
  let count = 0
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (localStorage.getItem(`rise-workout-${key}`)) count++
  }
  return count
}

function getWeeklyNutritionDays(): number {
  let count = 0
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    try {
      const n = JSON.parse(localStorage.getItem(`rise-nutrition-${key}`) || '{}')
      const total =
        (n.breakfast?.length ?? 0) +
        (n.lunch?.length ?? 0) +
        (n.dinner?.length ?? 0) +
        (n.snacks?.length ?? 0)
      if (total > 0) count++
    } catch {}
  }
  return count
}

function getTrashTalkFromMascot(winning: boolean, category: string): string {
  const winLines = [
    "You're CRUSHING it! Keep the heat on 🔥",
    "They can't keep up with you! Don't slow down 💪",
    "This is YOUR week. Seal the deal.",
    "Look at you go. They're shaking rn 😤",
    "DOMINANT. That's all I got.",
  ]
  const loseLines = [
    "Bro they're ahead... time to go BEAST MODE 😤",
    "You really gonna let them win? Didn't think so.",
    "This disrespect ends TODAY. Get to work.",
    "They're flexing on you rn. Show them who's boss.",
    "One workout away from turning this around. Let's go.",
  ]
  const lines = winning ? winLines : loseLines
  return lines[Math.floor(Math.random() * lines.length)]
}

// ─── Animated VS Bar ─────────────────────────────────────────────────────────

function VSBar({ yours, theirs, color }: { yours: number; theirs: number; color: string }) {
  const total = yours + theirs
  const yourPct = total === 0 ? 50 : Math.round((yours / total) * 100)
  const theirPct = 100 - yourPct
  const winning = yours >= theirs

  return (
    <div className="space-y-1.5">
      <div className="flex overflow-hidden rounded-full h-3 bg-secondary">
        <div
          className="h-full rounded-l-full transition-all duration-700"
          style={{ width: `${yourPct}%`, backgroundColor: color }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-700 bg-rose-500"
          style={{ width: `${theirPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
        <span style={{ color }}>You {yourPct}%</span>
        <span className="text-rose-400">Rival {theirPct}%</span>
      </div>
    </div>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────

function ChallengeCard({ challenge }: { challenge: RivalChallenge }) {
  const Icon = challenge.icon
  const winning = challenge.yours >= challenge.theirs
  const diff = Math.abs(challenge.yours - challenge.theirs)

  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-all',
      winning
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-rose-500/30 bg-rose-500/5'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl text-base',
            winning ? 'bg-emerald-500/15' : 'bg-rose-500/15'
          )}>
            {challenge.emoji}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{challenge.label}</p>
            <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
          winning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        )}>
          {winning ? '▲' : '▼'} {diff} {challenge.unit}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-center">
          <p className="text-2xl font-black text-foreground">{challenge.yours}</p>
          <p className="text-[10px] text-muted-foreground">You</p>
        </div>
        <div className="text-muted-foreground/30 text-xs font-bold">VS</div>
        <div className="text-center">
          <p className="text-2xl font-black text-rose-400">{challenge.theirs}</p>
          <p className="text-[10px] text-muted-foreground">Rival</p>
        </div>
      </div>

      <VSBar
        yours={challenge.yours}
        theirs={challenge.theirs}
        color={winning ? '#10b981' : '#6366f1'}
      />
    </div>
  )
}

// ─── Pick Rival Screen ────────────────────────────────────────────────────────

function PickRivalScreen({
  friends,
  onPick,
}: {
  friends: Friend[]
  onPick: (friend: Friend) => void
}) {
  return (
    <div className="space-y-5 pb-24 pt-2">
      <div className="text-center space-y-2 py-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30">
            <Swords className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-foreground">Rival Mode</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Pick one friend as your rival. Each week you compete across workouts, nutrition, streak & strength. Winner earns bragging rights (and XP).
        </p>
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12">
          <Shield className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 font-medium text-muted-foreground">No friends to rival yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Add friends first to start a rivalry</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose your rival
          </p>
          {friends.map(friend => {
            const rank = getRankByPerformance(friend.riseScore)
            return (
              <button
                key={friend.id}
                onClick={() => onPick(friend)}
                className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-rose-500/40 hover:bg-rose-500/5 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 text-xl font-black text-rose-400">
                  {friend.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{friend.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium" style={{ color: rank.color }}>{rank.name}</span>
                    <span className="text-xs text-muted-foreground">· {friend.riseScore} pts</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-orange-500" />{friend.streak}d
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400">
                  <Swords className="h-3 w-3" />
                  Challenge
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Active Rivalry View ──────────────────────────────────────────────────────

function ActiveRivalry({
  rival,
  myScore: ms,
  myStreak: mstr,
  onClear,
}: {
  rival: Friend
  myScore: number
  myStreak: number
  onClear: () => void
}) {
  const [mascotLine, setMascotLine] = useState('')
  const myRank = getRankByPerformance(ms)
  const rivalRank = getRankByPerformance(rival.riseScore)

  const myWorkouts = getWeeklyWorkouts()
  const myNutrition = getWeeklyNutritionDays()

  // Simulate rival weekly stats from their profile data (in real app, from DB)
  const rivalWorkouts = Math.min(7, Math.round((rival.workoutsCompleted ?? 0) / 4) % 5 + 1)
  const rivalNutrition = Math.min(7, rival.streak % 5 + 2)

  const challenges: RivalChallenge[] = [
    {
      category: 'workouts',
      label: 'Workouts This Week',
      icon: Dumbbell,
      emoji: '🏋️',
      description: 'Sessions logged in the last 7 days',
      yours: myWorkouts,
      theirs: rivalWorkouts,
      unit: 'sessions',
    },
    {
      category: 'nutrition',
      label: 'Nutrition Days',
      icon: Target,
      emoji: '🥗',
      description: 'Days you logged food this week',
      yours: myNutrition,
      theirs: rivalNutrition,
      unit: 'days',
    },
    {
      category: 'streak',
      label: 'Active Streak',
      icon: Flame,
      emoji: '🔥',
      description: 'Current day streak',
      yours: mstr,
      theirs: rival.streak,
      unit: 'days',
    },
    {
      category: 'strength',
      label: 'Strength Score',
      icon: TrendingUp,
      emoji: '⚡',
      description: 'Overall Rise performance score',
      yours: ms,
      theirs: rival.riseScore,
      unit: 'pts',
    },
  ]

  const myWins = challenges.filter(c => c.yours >= c.theirs).length
  const theirWins = challenges.length - myWins
  const overallWinning = myWins >= theirWins

  useEffect(() => {
    setMascotLine(getTrashTalkFromMascot(overallWinning, 'overall'))
  }, [overallWinning])

  // Days left in the week (resets Monday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysLeft = dayOfWeek === 0 ? 1 : 8 - dayOfWeek

  return (
    <div className="space-y-4 pb-24 pt-2">

      {/* Header: VS card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-5">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="absolute right-1/4 top-0 h-20 w-20 translate-x-1/2 rounded-full bg-rose-500/20 blur-2xl" />
        </div>

        <div className="relative flex items-center justify-between">
          {/* You */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 text-2xl font-black text-emerald-400 border border-emerald-500/20">
              {myRank.symbol === 'elite' ? '👑' : '⚔️'}
            </div>
            <p className="text-sm font-black text-white">You</p>
            <span className="text-[11px] font-semibold" style={{ color: myRank.color }}>
              {myRank.name}
            </span>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5">
              <Star className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{myWins} wins</span>
            </div>
          </div>

          {/* VS + timer */}
          <div className="flex flex-col items-center gap-1 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-medium text-white/40">{daysLeft}d left</span>
          </div>

          {/* Rival */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/30 to-rose-500/10 text-2xl font-black text-rose-400 border border-rose-500/20">
              {rival.name.charAt(0)}
            </div>
            <p className="text-sm font-black text-white truncate max-w-[80px] text-center">
              {rival.name.split(' ')[0]}
            </p>
            <span className="text-[11px] font-semibold" style={{ color: rivalRank.color }}>
              {rivalRank.name}
            </span>
            <div className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5">
              <Star className="h-3 w-3 text-rose-400" />
              <span className="text-xs font-bold text-rose-400">{theirWins} wins</span>
            </div>
          </div>
        </div>

        {/* Overall result bar */}
        <div className="relative mt-4">
          <div className="flex overflow-hidden rounded-full h-2 bg-white/10">
            <div
              className="h-full rounded-l-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${(myWins / challenges.length) * 100}%` }}
            />
            <div
              className="h-full rounded-r-full bg-rose-500 transition-all duration-1000"
              style={{ width: `${(theirWins / challenges.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mascot trash talk */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="text-2xl shrink-0">🤖</div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-0.5">RIZE says</p>
          <p className="text-sm font-medium text-foreground">{mascotLine}</p>
        </div>
      </div>

      {/* Category breakdowns */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          This Week's Battles
        </p>
        <div className="space-y-3">
          {challenges.map(c => (
            <ChallengeCard key={c.category} challenge={c} />
          ))}
        </div>
      </div>

      {/* Drop rival */}
      <button
        onClick={onClear}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
      >
        <X className="h-4 w-4" />
        End Rivalry
      </button>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function RivalMode({ onBack }: { onBack: () => void }) {
  const { friends, riseScore, streak } = useApp()
  const [rival, setRival] = useState<Friend | null>(() => {
    try {
      const saved = localStorage.getItem('rise-rival')
      if (!saved) return null
      return JSON.parse(saved) as Friend
    } catch {
      return null
    }
  })

  const connectedFriends = friends.filter(f => f.status === 'accepted')

  const handlePickRival = (friend: Friend) => {
    setRival(friend)
    localStorage.setItem('rise-rival', JSON.stringify(friend))
  }

  const handleClearRival = () => {
    setRival(null)
    localStorage.removeItem('rise-rival')
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-primary mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Friends
      </button>

      {rival ? (
        <ActiveRivalry
          rival={rival}
          myScore={riseScore}
          myStreak={streak}
          onClear={handleClearRival}
        />
      ) : (
        <PickRivalScreen
          friends={connectedFriends}
          onPick={handlePickRival}
        />
      )}
    </div>
  )
}