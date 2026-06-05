'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { FitnessGoal, Gender } from '@/lib/types'
import { calculateMacroTargets } from '@/lib/nutrition-calc'
import { useTheme } from 'next-themes'
import { User, Target, Bell, Palette, LogOut, Trash2, ChevronRight, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type SettingsView = 'main' | 'profile' | 'goals' | 'notifications'

export function SettingsPage() {
  const { settings, updateSettings, bodyPRs } = useApp()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<SettingsView>('main')
  const [editedProfile, setEditedProfile] = useState({
    name: settings.name,
    age: settings.age.toString(),
    weight: settings.weight.toString(),
    height: settings.height.toString(),
    gender: settings.gender,
    fitnessGoal: settings.fitnessGoal,
  })
  const [editedGoals, setEditedGoals] = useState({
    calorieGoal: settings.calorieGoal.toString(),
    proteinGoal: settings.proteinGoal.toString(),
    carbGoal: settings.carbGoal.toString(),
    fatGoal: settings.fatGoal.toString(),
  })

  const saveProfile = () => {
    updateSettings({
      name: editedProfile.name,
      age: parseInt(editedProfile.age) || settings.age,
      weight: parseFloat(editedProfile.weight) || settings.weight,
      height: parseFloat(editedProfile.height) || settings.height,
      gender: editedProfile.gender,
      fitnessGoal: editedProfile.fitnessGoal,
    })
    setView('main')
  }

  const saveGoals = () => {
    updateSettings({
      calorieGoal: parseInt(editedGoals.calorieGoal) || settings.calorieGoal,
      proteinGoal: parseInt(editedGoals.proteinGoal) || settings.proteinGoal,
      carbGoal: parseInt(editedGoals.carbGoal) || settings.carbGoal,
      fatGoal: parseInt(editedGoals.fatGoal) || settings.fatGoal,
    })
    setView('main')
  }

  const toggleNotification = (key: 'workouts' | 'meals' | 'streaks') => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    })
  }

  if (view === 'profile') {
    return (
      <SettingsSubpage
        title="Profile"
        onBack={() => setView('main')}
        onSave={saveProfile}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
            <Input
              value={editedProfile.name}
              onChange={e => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Age</label>
            <Input
              type="number"
              value={editedProfile.age}
              onChange={e => setEditedProfile(prev => ({ ...prev, age: e.target.value }))}
              placeholder="25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Weight (kg)</label>
            <Input
              type="number"
              value={editedProfile.weight}
              onChange={e => setEditedProfile(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Height (cm)</label>
            <Input
              type="number"
              value={editedProfile.height}
              onChange={e => setEditedProfile(prev => ({ ...prev, height: e.target.value }))}
              placeholder="175"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as Gender[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditedProfile(prev => ({ ...prev, gender: g }))}
                  className={cn(
                    'rounded-xl border py-2.5 text-sm font-medium capitalize',
                    editedProfile.gender === g
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Fitness goal</label>
            <div className="space-y-2">
              {(
                [
                  { id: 'lose_fat' as FitnessGoal, label: 'Lose fat' },
                  { id: 'maintain' as FitnessGoal, label: 'Maintain' },
                  { id: 'build_muscle' as FitnessGoal, label: 'Build muscle' },
                ] as const
              ).map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setEditedProfile(prev => ({ ...prev, fitnessGoal: g.id }))}
                  className={cn(
                    'w-full rounded-xl border py-2.5 text-sm font-medium',
                    editedProfile.fitnessGoal === g.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSubpage>
    )
  }

  if (view === 'goals') {
    return (
      <SettingsSubpage
        title="Goals"
        onBack={() => setView('main')}
        onSave={saveGoals}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Macros auto-calculate from your profile and lifts. Override manually or recalculate.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              const macros = calculateMacroTargets(
                settings.weight,
                settings.height,
                settings.age,
                settings.gender,
                settings.fitnessGoal,
                bodyPRs
              )
              updateSettings(macros)
              setEditedGoals({
                calorieGoal: macros.calorieGoal.toString(),
                proteinGoal: macros.proteinGoal.toString(),
                carbGoal: macros.carbGoal.toString(),
                fatGoal: macros.fatGoal.toString(),
              })
            }}
          >
            Recalculate from profile & PRs
          </Button>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Daily Calories</label>
            <Input
              type="number"
              value={editedGoals.calorieGoal}
              onChange={e => setEditedGoals(prev => ({ ...prev, calorieGoal: e.target.value }))}
              placeholder="2000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Protein (g)</label>
            <Input
              type="number"
              value={editedGoals.proteinGoal}
              onChange={e => setEditedGoals(prev => ({ ...prev, proteinGoal: e.target.value }))}
              placeholder="150"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Carbs (g)</label>
            <Input
              type="number"
              value={editedGoals.carbGoal}
              onChange={e => setEditedGoals(prev => ({ ...prev, carbGoal: e.target.value }))}
              placeholder="200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Fats (g)</label>
            <Input
              type="number"
              value={editedGoals.fatGoal}
              onChange={e => setEditedGoals(prev => ({ ...prev, fatGoal: e.target.value }))}
              placeholder="65"
            />
          </div>
        </div>
      </SettingsSubpage>
    )
  }

  if (view === 'notifications') {
    return (
      <SettingsSubpage
        title="Notifications"
        onBack={() => setView('main')}
      >
        <div className="space-y-1">
          <NotificationToggle
            label="Workout Reminders"
            description="Get reminded to complete your daily workout"
            checked={settings.notifications.workouts}
            onChange={() => toggleNotification('workouts')}
          />
          <NotificationToggle
            label="Meal Reminders"
            description="Get reminded to log your meals"
            checked={settings.notifications.meals}
            onChange={() => toggleNotification('meals')}
          />
          <NotificationToggle
            label="Streak Alerts"
            description="Get notified about your streak status"
            checked={settings.notifications.streaks}
            onChange={() => toggleNotification('streaks')}
          />
        </div>
      </SettingsSubpage>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile Section */}
      <div className="space-y-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <SettingsItem
          icon={User}
          label="Profile"
          description="Edit your personal information"
          onClick={() => {
            setEditedProfile({
              name: settings.name,
              age: settings.age.toString(),
              weight: settings.weight.toString(),
              height: settings.height.toString(),
              gender: settings.gender,
              fitnessGoal: settings.fitnessGoal,
            })
            setView('profile')
          }}
        />
        <SettingsItem
          icon={Target}
          label="Goals"
          description="Set your daily macro targets"
          onClick={() => {
            setEditedGoals({
              calorieGoal: settings.calorieGoal.toString(),
              proteinGoal: settings.proteinGoal.toString(),
              carbGoal: settings.carbGoal.toString(),
              fatGoal: settings.fatGoal.toString(),
            })
            setView('goals')
          }}
        />
        <SettingsItem
          icon={Bell}
          label="Notifications"
          description="Manage your reminders"
          onClick={() => setView('notifications')}
        />
      </div>

      {/* Appearance Section */}
      <div className="space-y-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Appearance
        </h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Palette className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  theme === 'light' ? 'bg-card shadow-sm' : 'text-muted-foreground'
                )}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  theme === 'dark' ? 'bg-card shadow-sm' : 'text-muted-foreground'
                )}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account Actions
        </h2>
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <LogOut className="h-5 w-5 text-foreground" />
          </div>
          <p className="font-medium text-foreground">Sign Out</p>
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl border border-destructive/20 bg-card p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <p className="font-medium text-destructive">Delete Account</p>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Rise Fitness v1.0.0
      </p>
    </div>
  )
}

function SettingsItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  )
}

function SettingsSubpage({
  title,
  onBack,
  onSave,
  children,
}: {
  title: string
  onBack: () => void
  onSave?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm font-medium text-primary"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {onSave ? (
          <button
            onClick={onSave}
            className="text-sm font-medium text-primary"
          >
            Save
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>
      {children}
    </div>
  )
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
