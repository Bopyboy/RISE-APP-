'use client'

import { Home, Utensils, Dumbbell, LayoutGrid, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'train', icon: Dumbbell, label: 'Train' },
  { id: 'food', icon: Utensils, label: 'Food' },
  { id: 'ranks', icon: Trophy, label: 'Ranks' },
  { id: 'more', icon: LayoutGrid, label: 'More' },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md px-6 pb-6">
        <div className="glass-nav flex h-16 items-center justify-around rounded-2xl border border-border shadow-lg">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center px-4 py-2 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className={cn('relative h-5 w-5', isActive && 'scale-110')} />
                <span className="relative mt-0.5 text-[10px] font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
