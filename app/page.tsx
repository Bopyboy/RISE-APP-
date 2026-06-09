'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { AppProvider, useApp } from '@/lib/app-context'
import { BottomNav } from '@/components/bottom-nav'
import { AppSplash } from '@/components/app-splash'
import { OnboardingFlow } from '@/components/onboarding-flow'
import { HomePage } from '@/components/home-page'
import { NutritionPage } from '@/components/nutrition-page'
import { TrainPage } from '@/components/train-page'
import { MorePage } from '@/components/more-page'
import { RanksPage } from '@/components/ranks-page'
import { GoalsPage } from '@/components/goals-page'
import { ChatPage } from '@/components/chat-page'
import { AuthScreen } from '@/components/auth-screen'
import { AppTutorial } from '@/components/app-tutorial'

function AppContent() {
  const { settings, isLoaded, user, isAuthLoading } = useApp()
  const [activeTab, setActiveTab] = useState('home')
  const [foodView, setFoodView] = useState<'diary' | 'plan'>('diary')
  const [coachOpen, setCoachOpen] = useState(false)

  const goToFood = (view: 'diary' | 'plan' = 'diary') => {
    setFoodView(view)
    setActiveTab('food')
  }

  if (isAuthLoading || !isLoaded) return <AppSplash />
  if (!user) return <AuthScreen />
  if (!settings.onboardingComplete) return <OnboardingFlow />

  return (
    <div className="rise-gradient-bg min-h-screen">
      <main className="mx-auto max-w-md px-4 pb-28 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'home' && (
              <HomePage
                onTabChange={setActiveTab}
                onGoToFood={goToFood}
                onOpenSettings={() => setActiveTab('more')}
                onOpenCoach={() => setCoachOpen(true)}
              />
            )}
            {activeTab === 'train' && (
              <TrainPage onTabChange={tab => tab === 'food' ? goToFood('plan') : setActiveTab(tab)} />
            )}
            {activeTab === 'food'  && <NutritionPage initialView={foodView} />}
            {activeTab === 'goals' && <GoalsPage />}
            {activeTab === 'ranks' && <RanksPage />}
            {activeTab === 'more'  && <MorePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AppTutorial onTabChange={setActiveTab} />

      {/* Coach slide-up modal */}
      <AnimatePresence>
        {coachOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setCoachOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl border-t border-border bg-background"
              style={{ height: '82vh' }}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="font-bold text-foreground">Rise Coach</p>
                  <p className="text-xs text-muted-foreground">AI fitness & life advice</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCoachOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-full overflow-y-auto pb-16 px-4 pt-4">
                <ChatPage />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <AppSplash />
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
