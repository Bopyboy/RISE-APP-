'use client'

import { useApp } from '@/lib/app-context'
import { RankBadge } from '@/components/rank-badge'
import { BodyChartPage } from '@/components/body-chart-page'
import { BodyCompositionPage } from '@/components/body-composition-page'
import { ProgressPhotosPage } from '@/components/progress-photos-page'
import { FriendsPage } from '@/components/friends-page'
import { ShopPage } from '@/components/shop-page'
import { Activity, Scale, Camera, Trophy, Users, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RANKS } from '@/lib/types'
import {
  getRankByPerformance,
  getNextPerformanceRank,
  getRankProgressPercent,
  getPerformanceLabel,
} from '@/lib/performance-rank'

type RankSection = 'ranks' | 'body' | 'composition' | 'photos' | 'friends' | 'shop'

export function RanksPage() {
  const { getPerformanceScore } = useApp()
  const [section, setSection] = useState<RankSection>('ranks')

  const score = getPerformanceScore()
  const currentRank = getRankByPerformance(score)
  const nextRank = getNextPerformanceRank(score)
  const progress = getRankProgressPercent(score)
  const label = getPerformanceLabel(score)

  const tabs = [
    { id: 'ranks' as RankSection,       label: 'Ranks',   icon: Trophy },
    { id: 'body' as RankSection,        label: 'Body',    icon: Activity },
    { id: 'composition' as RankSection, label: 'Body Fat',icon: Scale },
    { id: 'photos' as RankSection,      label: 'Photos',  icon: Camera },
    { id: 'friends' as RankSection,     label: 'Friends', icon: Users },
    { id: 'shop' as RankSection,        label: 'Shop',    icon: ShoppingBag },
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
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: currentRank.color + '4d', backgroundColor: currentRank.color + '0d' }}
          >
            <div className="flex items-center gap-4">
              <RankBadge symbol={currentRank.symbol} size={56} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Current Rank</p>
                <p className="text-2xl font-bold" style={{ color: currentRank.color }}>{currentRank.name}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{score}</p>
                <p className="text-xs text-muted-foreground">/ 100 pts</p>
              </div>
            </div>

            {nextRank && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentRank.name}</span>
                  <span>{nextRank.name} — {nextRank.minScore} pts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: currentRank.color }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}

            {!nextRank && (
              <p className="mt-3 text-center text-sm font-semibold" style={{ color: currentRank.color }}>
                Max rank achieved 🏆
              </p>
            )}
          </div>

          {/* All ranks ladder */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">All Ranks</p>
            {RANKS.map(rank => {
              const isCurrentRank = rank.symbol === currentRank.symbol
              const isUnlocked = score >= rank.minScore
              return (
                <div
                  key={rank.symbol}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                    isCurrentRank ? 'border' : isUnlocked ? 'bg-secondary/40' : 'opacity-40'
                  )}
                  style={isCurrentRank ? {
                    borderColor: rank.color + '4d',
                    backgroundColor: rank.color + '0d',
                  } : {}}
                >
                  <RankBadge symbol={rank.symbol} size={32} />
                  <div className="flex-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isCurrentRank ? rank.color : undefined }}
                    >
                      {rank.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{rank.minScore} pts required</p>
                  </div>
                  {isCurrentRank && (
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: rank.color, borderColor: rank.color + '4d', backgroundColor: rank.color + '1a' }}
                    >
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
      {section === 'friends' && <FriendsPage />}
      {section === 'shop' && <ShopPage />}
    </div>
  )
}
