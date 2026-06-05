'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider, useApp } from '@/lib/app-context'
import { BottomNav } from '@/components/bottom-nav'
import { AppSplash } from '@/components/app-splash'
import { OnboardingFlow } from '@/components/onboarding-flow'
import { HomePage } from '@/components/home-page'
import { NutritionPage } from '@/components/nutrition-page'
import { TrainPage } from '@/components/train-page'
import { MorePage } from '@/components/more-page'
import { RanksPage } from '@/components/ranks-page'
import { AuthScreen } from '@/components/auth-screen'
import { AppTutorial } from '@/components/app-tutorial'

function AppContent() {
  const { settings, isLoaded, user, isAuthLoading } = useApp()
  const [activeTab, setActiveTab] = useState('home')
  const [foodView, setFoodView] = useState<'diary' | 'plan'>('diary')

  const goToFood = (view: 'diary' | 'plan' = 'diary') => {
    setFoodView(view)
    setActiveTab('food')
  }

  if (isAuthLoading || !isLoaded) {
    return <AppSplash />
  }

  if (!user) {
    return <AuthScreen />
  }

  if (!settings.onboardingComplete) {
    return <OnboardingFlow />
  }

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
              <HomePage onTabChange={setActiveTab} onGoToFood={goToFood} />
            )}
            {activeTab === 'train' && <TrainPage onTabChange={tab => tab === 'food' ? goToFood('plan') : setActiveTab(tab)} />}
            {activeTab === 'food' && <NutritionPage initialView={foodView} />}
            {activeTab === 'ranks' && <RanksPage />}
            {activeTab === 'more' && <MorePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AppTutorial onTabChange={setActiveTab} />
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <AppSplash />
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}