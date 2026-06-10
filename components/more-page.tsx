'use client'

import { useState } from 'react'
import { MessageCircle, Users, ShoppingBag, Settings, Target, ChevronRight } from 'lucide-react'
import { ChatPage } from '@/components/chat-page'
import { FriendsPage } from '@/components/friends-page'
import { ShopPage } from '@/components/shop-page'
import { SettingsPage } from '@/components/settings-page'
import { GoalsPage } from '@/components/goals-page'

type MoreSection = 'menu' | 'coach' | 'friends' | 'shop' | 'settings' | 'goals'

const MENU = [
  { id: 'goals'    as const, label: 'Goals',      desc: 'Set and track your goals',    icon: Target },
  { id: 'coach'    as const, label: 'Rise Coach',  desc: 'AI fitness advice',           icon: MessageCircle },
  { id: 'friends'  as const, label: 'Friends',     desc: 'Leaderboards & codes',        icon: Users },
  { id: 'shop'     as const, label: 'Shop',        desc: 'Badges, banners, XP',         icon: ShoppingBag },
  { id: 'settings' as const, label: 'Settings',    desc: 'Profile, goals, theme',       icon: Settings },
]

export function MorePage() {
  const [section, setSection] = useState<MoreSection>('menu')

  if (section !== 'menu') {
    return (
      <div className="pb-20">
        <button
          type="button"
          onClick={() => setSection('menu')}
          className="mb-4 text-sm font-medium text-primary"
        >
          ← Back
        </button>
        {section === 'goals'    && <GoalsPage />}
        {section === 'coach'    && <ChatPage />}
        {section === 'friends'  && <FriendsPage />}
        {section === 'shop'     && <ShopPage />}
        {section === 'settings' && <SettingsPage />}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">More</h1>
        <p className="text-sm text-muted-foreground">Goals, coach, social & settings</p>
      </div>
      <div className="space-y-2">
        {MENU.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-card/80"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
