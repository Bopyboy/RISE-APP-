'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { ShoppingBag, Zap, Check, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShopItem {
  id: string
  name: string
  description: string
  type: 'banner' | 'badge' | 'xp_potion'
  cost: number
  preview: string
  gradient?: string
  xpBoost?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'banner_fire',
    name: 'Inferno Banner',
    description: 'Blaze orange profile banner — let everyone feel the heat.',
    type: 'banner',
    cost: 200,
    preview: '🔥',
    gradient: 'from-orange-600 via-red-500 to-yellow-400',
    rarity: 'common',
  },
  {
    id: 'banner_ocean',
    name: 'Deep Ocean Banner',
    description: 'Cool teal-to-blue gradient that radiates calm power.',
    type: 'banner',
    cost: 200,
    preview: '🌊',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    rarity: 'common',
  },
  {
    id: 'banner_galaxy',
    name: 'Galaxy Banner',
    description: 'Cosmic purple & pink — you\'re built different.',
    type: 'banner',
    cost: 350,
    preview: '🌌',
    gradient: 'from-purple-600 via-pink-500 to-indigo-700',
    rarity: 'rare',
  },
  {
    id: 'banner_gold',
    name: 'Golden Hour Banner',
    description: 'Rich gold gradient reserved for the dedicated.',
    type: 'banner',
    cost: 500,
    preview: '✨',
    gradient: 'from-yellow-400 via-amber-400 to-orange-400',
    rarity: 'rare',
  },
  {
    id: 'banner_neon',
    name: 'Neon Grind Banner',
    description: 'Electric green — for those who never stop grinding.',
    type: 'banner',
    cost: 600,
    preview: '⚡',
    gradient: 'from-green-400 via-emerald-400 to-teal-500',
    rarity: 'epic',
  },
  {
    id: 'banner_elite',
    name: 'Elite Aura Banner',
    description: 'Ultra-rare rainbow shimmer. Only for the top.',
    type: 'banner',
    cost: 1200,
    preview: '👑',
    gradient: 'from-rose-500 via-violet-500 to-cyan-500',
    rarity: 'legendary',
  },
  {
    id: 'badge_grinder',
    name: '💪 Grinder Badge',
    description: 'Show the world you never skip a session.',
    type: 'badge',
    cost: 150,
    preview: '💪',
    rarity: 'common',
  },
  {
    id: 'badge_beast',
    name: '🦁 Beast Mode Badge',
    description: 'You go harder than everyone else.',
    type: 'badge',
    cost: 300,
    preview: '🦁',
    rarity: 'rare',
  },
  {
    id: 'badge_legend',
    name: '🏆 Legend Badge',
    description: 'Legendary status. Enough said.',
    type: 'badge',
    cost: 800,
    preview: '🏆',
    rarity: 'epic',
  },
  {
    id: 'xp_small',
    name: 'XP Potion',
    description: 'Instantly adds +250 XP to your Rise Score.',
    type: 'xp_potion',
    cost: 100,
    preview: '🧪',
    xpBoost: 250,
    rarity: 'common',
  },
  {
    id: 'xp_medium',
    name: 'XP Mega Potion',
    description: 'Instantly adds +750 XP to your Rise Score.',
    type: 'xp_potion',
    cost: 250,
    preview: '⚗️',
    xpBoost: 750,
    rarity: 'rare',
  },
  {
    id: 'xp_large',
    name: 'XP Ultra Potion',
    description: 'Instantly adds +2,000 XP to your Rise Score.',
    type: 'xp_potion',
    cost: 600,
    preview: '🔮',
    xpBoost: 2000,
    rarity: 'epic',
  },
]

const RARITY_STYLES: Record<ShopItem['rarity'], { label: string; color: string; bg: string; border: string }> = {
  common:    { label: 'Common',    color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/30' },
  rare:      { label: 'Rare',      color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/40' },
  epic:      { label: 'Epic',      color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/40' },
  legendary: { label: 'Legendary', color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/50' },
}

function ShopItemCard({
  item, coins, owned, equipped, onBuy, onEquip,
}: {
  item: ShopItem
  coins: number
  owned: boolean
  equipped: boolean
  onBuy: (item: ShopItem) => void
  onEquip: (item: ShopItem) => void
}) {
  const rarity = RARITY_STYLES[item.rarity]
  const canAfford = coins >= item.cost

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-card p-4 transition-all', equipped ? 'border-primary/60' : rarity.border)}>
      {item.rarity === 'legendary' && (
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-400/20 blur-2xl" />
      )}

      {item.type === 'banner' && item.gradient && (
        <div className={cn('mb-3 h-14 w-full rounded-xl bg-gradient-to-r', item.gradient, 'flex items-center justify-center text-2xl shadow-inner')}>
          {item.preview}
        </div>
      )}

      {item.type !== 'banner' && (
        <div className="mb-3 flex h-14 w-full items-center justify-center rounded-xl bg-secondary text-3xl">
          {item.preview}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight">{item.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{item.description}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', rarity.bg, rarity.color)}>
          {rarity.label}
        </span>
      </div>

      {item.type === 'xp_potion' && item.xpBoost && (
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-purple-500/10 px-2 py-1">
          <Zap className="h-3 w-3 text-purple-400" />
          <span className="text-xs font-semibold text-purple-400">+{item.xpBoost.toLocaleString()} XP instantly</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-amber-400">🪙</span>
          <span className="text-sm font-bold text-foreground">{item.cost}</span>
        </div>

        {owned ? (
          item.type !== 'xp_potion' ? (
            <button
              onClick={() => onEquip(item)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
                equipped ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
            >
              {equipped ? <><Check className="h-3 w-3" /> Equipped</> : 'Equip'}
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-xl bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400">
              <Check className="h-3 w-3" /> Used
            </span>
          )
        ) : (
          <button
            onClick={() => onBuy(item)}
            disabled={!canAfford}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              canAfford ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'cursor-not-allowed bg-secondary text-muted-foreground'
            )}
          >
            {canAfford ? <><ShoppingBag className="h-3 w-3" /> Buy</> : <><Lock className="h-3 w-3" /> Need more</>}
          </button>
        )}
      </div>
    </div>
  )
}

type FilterType = 'all' | 'banner' | 'badge' | 'xp_potion'

export function ShopPage() {
  const { coins, ownedItems, equippedItems, buyItem, equipItem, addCoins } = useApp()
  const [filter, setFilter] = useState<FilterType>('all')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleBuy = (item: ShopItem) => {
    if (coins < item.cost) return
    buyItem(item.id, item.cost)
    if (item.type === 'xp_potion' && item.xpBoost) {
      addCoins(Math.round(item.xpBoost / 10))
      showToast(`⚗️ +${Math.round(item.xpBoost / 10)} coins! Rank is based on your PRs.`)
    } else {
      showToast(`✅ ${item.name} purchased!`)
    }
  }

  const handleEquip = (item: ShopItem) => {
    equipItem(item.id, item.type)
    showToast(`✨ ${item.name} equipped!`)
  }

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'banner', label: '🎨 Banners' },
    { id: 'badge', label: '🏅 Badges' },
    { id: 'xp_potion', label: '⚗️ XP Potions' },
  ]

  const filtered = filter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.type === filter)

  return (
    <div className="space-y-4 pb-20">
      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <p className="text-sm text-muted-foreground">Customize your profile</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-sm font-bold text-amber-400">{coins.toLocaleString()}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-semibold text-foreground">How to earn coins</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><span>✅</span> Complete daily quest (+50)</div>
          <div className="flex items-center gap-1.5"><span>🔥</span> Maintain streak</div>
          <div className="flex items-center gap-1.5"><span>🍗</span> Hit protein goal</div>
          <div className="flex items-center gap-1.5"><span>🏋️</span> Log a workout</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(item => (
          <ShopItemCard
            key={item.id}
            item={item}
            coins={coins}
            owned={ownedItems.includes(item.id)}
            equipped={equippedItems[item.type] === item.id}
            onBuy={handleBuy}
            onEquip={handleEquip}
          />
        ))}
      </div>
    </div>
  )
}