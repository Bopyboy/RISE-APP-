'use client'

import { useApp } from '@/lib/app-context'
import { RankBadge } from '@/components/rank-badge'
import { BodyChartPage } from '@/components/body-chart-page'
import { BodyCompositionPage } from '@/components/body-composition-page'
import { ProgressPhotosPage } from '@/components/progress-photos-page'
import { Activity, Scale, Camera, Trophy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type RankSection = 'ranks' | 'body' | 'composition' | 'photos'

const RANKS = [
  { symbol: 'iron',        label: 'Iron',        xp: 0,     color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30' },
  { symbol: 'bronze',      label: 'Bronze',      xp: 500,   color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  { symbol: 'silver',      label: 'Silver',      xp: 1500,  color: 'text-slate-300',  bg: 'bg-slate-300/10',  border: 'border-slate-300/30' },
  { symbol: 'gold',        label: 'Gold',        xp: 3000,  color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  { symbol: 'platinum',    label: 'Platinum',    xp: 6000,  color: 'text-cyan-300',   bg: 'bg-cyan-300/10',   border: 'border-cyan-300/30' },
  { symbol: 'diamond',     label: 'Diamond',     xp: 10000, color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/30' },
  { symbol: 'master',      label: 'Master',      xp: 15000, color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
  { symbol: 'grandmaster', label: 'Grandmaster', xp: 22000, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { symbol: 'elite',       label: 'Elite',       xp: 30000, color: 'text-amber-300',  bg: 'bg-amber-300/10',  border: 'border-amber-300/30' },
]

export function RanksPage() {
  const { settings } = useApp()
  const [section, setSection] = useState<RankSection>('ranks')

  const xp = settings.xp ?? 0
  const currentRankIndex = [...RANKS].reverse().findIndex(r => xp >= r.xp)
  const currentRank = RANKS[RANKS.length - 1 - (currentRankIndex === -1 ? RANKS.length - 1 : currentRankIndex)]
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1]
  const progress = nextRank
    ? Math.min(100, Math.round(((xp - currentRank.xp) / (nextRank.xp - currentRank.xp)) * 100))
    : 100

  const tabs = [
    { id: 'ranks' as RankSection,       label: 'Ranks',    icon: Trophy },
    { id: 'body' as RankSection,        label: 'Body',     icon: Activity },
    { id: 'composition' as RankSection, label: 'Body Fat', icon: Scale },
    { id: 'photos' as RankSection,      label: 'Photos',   icon: Camera },
  ]

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranks</h1>
        <p className="text-sm text-muted-foreground">Progress, body stats & your journey</p>
      </div>

      {/* Tab bar */}
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

      {section === 'ranks' && (
        <div className="space-y-4">
          {/* Current rank card */}
          <div className={cn('rounded-2xl border p-5', currentRank.border, currentRank.bg)}>
            <div className="flex items-center gap-4">
              <RankBadge symbol={currentRank.symbol} size={56} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Current Rank</p>
                <p className={cn('text-2xl font-bold', currentRank.color)}>{currentRank.label}</p>
                <p className="text-sm text-muted-foreground">{xp.toLocaleString()} XP</p>
              </div>
            </div>

            {nextRank && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentRank.label}</span>
                  <span>{nextRank.label} — {nextRank.xp.toLocaleString()} XP</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full transition-all', currentRank.color.replace('text-', 'bg-'))}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}
          </div>

          {/* All ranks ladder */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">All Ranks</p>
            {RANKS.map((rank, i) => {
              const isCurrentRank = rank.symbol === currentRank.symbol
              const isUnlocked = xp >= rank.xp
              return (
                <div
                  key={rank.symbol}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                    isCurrentRank ? cn('border', rank.border, rank.bg) : isUnlocked ? 'bg-secondary/40' : 'opacity-40'
                  )}
                >
                  <RankBadge symbol={rank.symbol} size={32} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isCurrentRank ? rank.color : 'text-foreground')}>
                      {rank.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{rank.xp.toLocaleString()} XP</p>
                  </div>
                  {isCurrentRank && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', rank.bg, rank.color, 'border', rank.border)}>
                      YOU
                    </span>
                  )}
                  {!isCurrentRank && isUnlocked && (
                    <span className="text-xs text-muted-foreground">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {section === 'body' && <BodyChartPage />}
      {section === 'composition' && <BodyCompositionPage />}
      {section === 'photos' && <ProgressPhotosPage />}
    </div>
  )
}